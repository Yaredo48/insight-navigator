import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
console.log('PDF Parser loaded, type:', typeof pdfParse);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject typo mapping
const subjectMap: Record<string, string> = {
    'PysicalEducation': 'Physical Education',
    'Citizinship': 'Citizenship',
    'Biology': 'Biology',
    'Amharic': 'Amharic',
    'Mathimatics': 'Mathematics',
    'Economics': 'Economics'
};

async function extractTextFromPDF(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    try {
        const data = await pdfParse(buffer);
        return { text: data.text, pageCount: data.numpages, info: data.info };
    } catch (error) {
        console.error(`Error parsing PDF ${filePath}:`, error);
        return { text: '', pageCount: 0, info: {} };
    }
}

async function uploadFileToStorage(filePath: string, storagePath: string): Promise<string | null> {
    try {
        const fileContent = fs.readFileSync(filePath);
        const { data, error } = await supabase.storage
            .from('educational-content')
            .upload(storagePath, fileContent, { contentType: 'application/pdf', upsert: true });

        if (error) {
            console.error(`Error uploading ${filePath} to storage:`, error.message);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('educational-content')
            .getPublicUrl(storagePath);

        return urlData.publicUrl;
    } catch (err) {
        console.error(`Error uploading file ${filePath}:`, err);
        return null;
    }
}

function normalizeSubject(filename: string) {
    const clean = filename
        .replace(/_G_\d+/i, '')
        .replace(/ G \d+/i, '')
        .replace(/_/g, ' ')
        .replace(/.pdf$/i, '')
        .trim();
    for (const [key, val] of Object.entries(subjectMap)) {
        if (clean.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return clean;
}

async function getSubjectId(subjectName: string): Promise<number | null> {
    const cleanName = normalizeSubject(subjectName);
    const { data } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', cleanName)
        .maybeSingle();
    if (data) return data.id;

    console.warn(`Subject not found: ${subjectName} (normalized: ${cleanName})`);
    return null;
}

async function getGradeId(gradeName: string): Promise<number | null> {
    const match = gradeName.match(/(\d+)/);
    const gradeNum = match ? parseInt(match[1]) : null;
    if (!gradeNum) return null;

    const { data } = await supabase
        .from('grades')
        .select('id')
        .eq('grade_number', gradeNum)
        .maybeSingle();

    if (!data) {
        console.warn(`Grade not found: ${gradeName}`);
        return null;
    }
    return data.id;
}

async function processFile(filePath: string, gradeFolder: string) {
    const fileName = path.basename(filePath);
    const gradeId = await getGradeId(gradeFolder);
    const subjectId = await getSubjectId(fileName);

    console.log(`Processing: ${fileName}`);
    console.log(`  Identified Grade ID: ${gradeId}, Subject ID: ${subjectId}`);

    const pdfData = await extractTextFromPDF(filePath);
    if (!pdfData.text || pdfData.text.length < 100) {
        console.warn(`  Warning: extracted text is very short or empty.`);
    }

    const storagePath = `books/${gradeId || 'general'}/${subjectId || 'general'}/${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const publicUrl = await uploadFileToStorage(filePath, storagePath);

    if (!publicUrl) {
        console.error(`  Skipping database insertion due to upload failure.`);
        return;
    }

    const bookRecord = {
        title: fileName.replace('.pdf', ''),
        author: pdfData.info?.Author || null,
        grade_id: gradeId,
        subject_id: subjectId,
        file_name: fileName,
        file_size: fs.statSync(filePath).size,
        file_type: 'application/pdf',
        storage_path: storagePath,
        download_url: publicUrl,
        extracted_text: pdfData.text,
        is_processed: true,
        page_count: pdfData.pageCount,
        metadata: pdfData.info || {}
    };

    const { error } = await supabase
        .from('books')
        .upsert(bookRecord, { onConflict: 'storage_path' });

    if (error) console.error(`  Database Error:`, error.message);
    else console.log(`  Success!`);
}

async function main() {
    const baseDir = process.env.BOOKS_DIR || '/home/yared/Desktop/books';
    const gradeFolders = ['grade-9', 'grade-10', 'grade-11', 'grade-12'];

    for (const folder of gradeFolders) {
        const fullPath = path.join(baseDir, folder);
        if (!fs.existsSync(fullPath)) {
            console.warn(`Directory not found: ${fullPath}`);
            continue;
        }

        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'educational-content')) {
            console.log('Creating bucket: educational-content');
            const { error } = await supabase.storage.createBucket('educational-content', { public: true });
            if (error) console.error('Error creating bucket:', error);
        }

        const files = await glob('**/*.pdf', { cwd: fullPath, absolute: true });
        console.log(`Found ${files.length} PDFs in ${folder}`);

        for (const file of files) {
            await processFile(file, folder);
        }
    }

    console.log('All ingestion complete.');
}

main().catch(console.error);
