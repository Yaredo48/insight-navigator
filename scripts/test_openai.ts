// Use built-in fetch

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testOpenAI() {
    console.log('Testing OpenAI API key...');
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: "Say hello" }
                ],
                max_tokens: 5
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Success!', data.choices[0].message.content);
        } else {
            console.error('Error Status:', response.status);
            console.error('Error Data:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testOpenAI();
