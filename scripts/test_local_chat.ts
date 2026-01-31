async function testChatFunction() {
    console.log('Testing local chat function...');
    const payload = {
        messages: [
            { role: 'user', content: 'What does the physics textbook say about motion?' }
        ],
        conversationId: 'test-conversation',
        role: 'student',
        grade: 9,
        subject: 'Physics'
    };

    try {
        const response = await fetch('http://127.0.0.1:54321/functions/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + "sb_publishable_L22R912PEaefiFkDaPQkuw_9TAHOArT"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Response Status:', response.status);
            const reader = response.body.getReader();
            let result = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += new TextDecoder().decode(value);
            }
            console.log('Full Response:', result);
        } else {
            const errorText = await response.text();
            console.error('Error Status:', response.status);
            console.error('Error Body:', errorText);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testChatFunction();
