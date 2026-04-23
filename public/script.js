async function openEmail(id, subject, from) {
    const msgView = document.getElementById('message-view');
    const mailTable = document.getElementById('mail-table');
    if (!msgView || !mailTable) return;

    mailTable.style.display = 'none';
    document.querySelectorAll('.select-bar, .action-bar').forEach(el => el.style.display = 'none');
    msgView.style.display = 'block';
    
    document.getElementById('msg-subject').textContent = subject;
    document.getElementById('msg-from-name').textContent = from;
    document.getElementById('msg-body').textContent = "Loading message body...";

    const creds = {
        email: localStorage.getItem('gmail_user'),
        password: localStorage.getItem('gmail_pass'),
        server: localStorage.getItem('gmail_server'),
        index: id
    };

    try {
        const response = await fetch('/api/fetch-body', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });
        const data = await response.json();
        document.getElementById('msg-body').textContent = data.body;
    } catch (err) {
        document.getElementById('msg-body').textContent = "Error: " + err.message;
    }
}

async function loadRealMail(folderName = 'INBOX') {
    const table = document.getElementById('mail-table');
    if (!table) return;

    const cacheKey = `gmail_cache_${folderName}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const data = JSON.parse(cachedData);
        renderTable(data.emails);
        updateSidebarCounts(data.unreadCount);
    }

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
        
        localStorage.setItem(cacheKey, JSON.stringify(data));
        renderTable(data.emails);
        updateSidebarCounts(data.unreadCount);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

function renderTable(emails) {
    const table = document.getElementById('mail-table');
    if (!table) return;
    table.innerHTML = ''; 
    emails.forEach(mail => {
        const tr = document.createElement('tr');
        tr.className = mail.unseen ? 'unread' : 'read'; 
        tr.onclick = () => openEmail(mail.id, mail.subject, mail.from);
        tr.innerHTML = `
            <td class="col-check"><input type="checkbox"></td>
            <td class="col-sender">${mail.from.split('<')[0].replace(/"/g, '')}</td>
            <td class="col-subject">${mail.subject}</td>
            <td class="col-time">${new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        `;
        table.appendChild(tr);
    });
}

function updateSidebarCounts(count) {
    const inboxLink = document.querySelector('.inbox-link');
    if (!inboxLink) return;
    inboxLink.innerHTML = count > 0 ? `<b>Inbox (${count})</b>` : 'Inbox';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('gmail_user')) {
        window.location.href = 'index.html';
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    loadRealMail(urlParams.get('folder') || 'INBOX');
});

function showInbox() {
    const table = document.getElementById('mail-table');
    const msgView = document.getElementById('message-view');
    if (table) table.style.display = 'table';
    if (msgView) msgView.style.display = 'none';
    document.querySelectorAll('.select-bar, .action-bar').forEach(el => el.style.display = 'flex');
}

function refreshInbox() {
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder') || 'INBOX';
    
    localStorage.removeItem(`gmail_cache_${folder}`);
    
    loadRealMail(folder);
}