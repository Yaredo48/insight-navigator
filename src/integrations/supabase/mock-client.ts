export const mockData = {
    grades: [
        { id: 9, grade_number: 9, name: 'Grade 9', created_at: new Date().toISOString() },
        { id: 10, grade_number: 10, name: 'Grade 10', created_at: new Date().toISOString() },
        { id: 11, grade_number: 11, name: 'Grade 11', created_at: new Date().toISOString() },
        { id: 12, grade_number: 12, name: 'Grade 12', created_at: new Date().toISOString() },
    ],
    subjects: [
        { id: 1, name: 'Mathematics', code: 'MATH', created_at: new Date().toISOString() },
        { id: 2, name: 'Physics', code: 'PHY', created_at: new Date().toISOString() },
        { id: 3, name: 'Chemistry', code: 'CHEM', created_at: new Date().toISOString() },
        { id: 4, name: 'Biology', code: 'BIO', created_at: new Date().toISOString() },
        { id: 5, name: 'English', code: 'ENG', created_at: new Date().toISOString() },
        { id: 6, name: 'Amharic', code: 'AMH', created_at: new Date().toISOString() },
        { id: 7, name: 'History', code: 'HIST', created_at: new Date().toISOString() },
        { id: 8, name: 'Geography', code: 'GEO', created_at: new Date().toISOString() },
    ],
    classes: [
        { id: 'class-1', name: 'Math Grade 9-A', teacher_id: 'guest-user-id', grade_id: 9, subject_id: 1, created_at: new Date().toISOString() },
        { id: 'class-2', name: 'Physics Grade 10-C', teacher_id: 'guest-user-id', grade_id: 10, subject_id: 2, created_at: new Date().toISOString() },
    ],
    user_profiles: [
        { id: 'guest-user-id', name: 'Guest User', role: 'teacher', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    books: [],
    quizzes: [],
    flashcard_decks: [],
};

const createMockQuery = (data: any[]) => {
    const query: any = {
        data,
        error: null,
        select: () => query,
        order: () => query,
        eq: () => query,
        neq: () => query,
        gt: () => query,
        lt: () => query,
        gte: () => query,
        lte: () => query,
        like: () => query,
        ilike: () => query,
        is: () => query,
        in: () => query,
        contains: () => query,
        containedBy: () => query,
        single: () => ({ data: data[0] || null, error: null }),
        maybeSingle: () => ({ data: data[0] || null, error: null }),
        then: (resolve: any) => resolve({ data, error: null }),
        insert: (values: any) => {
            const newItems = Array.isArray(values) ? values : [values];
            newItems.forEach(item => data.push({ id: Math.random().toString(36).substr(2, 9), ...item, created_at: new Date().toISOString() }));
            return createMockQuery(newItems);
        },
        update: (values: any) => {
            data.forEach(item => Object.assign(item, values));
            return query;
        },
        delete: () => {
            data.length = 0;
            return query;
        },
        upsert: (values: any) => {
            const newItems = Array.isArray(values) ? values : [values];
            newItems.forEach(item => {
                const index = data.findIndex(d => d.id === item.id);
                if (index !== -1) data[index] = { ...data[index], ...item };
                else data.push({ id: Math.random().toString(36).substr(2, 9), ...item, created_at: new Date().toISOString() });
            });
            return createMockQuery(newItems);
        },
    };
    return query;
};

export const createMockSupabase = () => {
    const client: any = {
        from: (table: string) => {
            const tableData = (mockData as any)[table] || [];
            return createMockQuery(tableData);
        },
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
            signUp: async () => ({ data: { user: null, session: null }, error: null }),
            signOut: async () => ({ error: null }),
        },
        storage: {
            from: () => ({
                upload: async () => ({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/150' } }),
            }),
        },
    };
    return client;
};
