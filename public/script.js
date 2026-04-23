async function openEmail(id, subject, from) {
    const msgView = document.getElementById('message-view');
    const mailTable = document.getElementById('mail-table');
    
    mailTable.style.display = 'none';
    document.querySelectorAll('.select-bar, .action-bar').forEach(el => el.style.display = 'none');
    msgView.style.display = 'block';
    
    document.getElementById('msg-subject').textContent = subject;
    document.getElementById('msg-from-name').textContent = from;
    document.getElementById('msg-body').textContent = "Loading message body...";

    const urlParams = new URLSearchParams(window.location.search);
    const creds = {
        email: localStorage.getItem('gmail_user'),
        password: localStorage.getItem('gmail_pass'),
        server: localStorage.getItem('gmail_server'),
        folder: urlParams.get('folder') || 'INBOX',
        index: id
    };

    try {
        const response = await fetch('/api/fetch-body', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        document.getElementById('msg-body').textContent = data.body;
    } catch (err) {
        document.getElementById('msg-body').textContent = "Error: " + err.message;
    }
}

async function loadRealMail(folderName = 'INBOX') {
    const table = document.getElementById('mail-table');
    table.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Loading...</td></tr>';

    const creds = {
        email: localStorage.getItem('gmail_user'),
        password: localStorage.getItem('gmail_pass'),
        server: localStorage.getItem('gmail_server'),
        folder: folderName
    };

    try {
        const response = await fetch('/api/fetch-mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });
        const data = await response.json();
        
        table.innerHTML = ''; 
        data.forEach(mail => {
            const tr = document.createElement('tr');
            tr.className = 'unread';
            tr.onclick = () => openEmail(mail.id, mail.subject, mail.from);
            tr.innerHTML = `
                <td class="col-check"><input type="checkbox"></td>
                <td class="col-sender">${mail.from.split('<')[0].replace(/"/g, '')}</td>
                <td class="col-subject">${mail.subject}</td>
                <td class="col-time">${new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            `;
            table.appendChild(tr);
        });
    } catch (err) {
        table.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">${err.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('gmail_user');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    loadRealMail(urlParams.get('folder') || 'INBOX');
});

function showInbox() {
    document.getElementById('mail-table').style.display = 'table';
    document.getElementById('message-view').style.display = 'none';
    document.querySelectorAll('.select-bar, .action-bar').forEach(el => el.style.display = 'flex');
}
