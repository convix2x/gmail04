from flask import Flask, request, jsonify
from flask_cors import CORS
import imaplib
import email
from email.header import decode_header

app = Flask(__name__)
CORS(app)

def get_decoded_subject(raw_subject):
    if not raw_subject: return "(No Subject)"
    try:
        decoded_parts = decode_header(raw_subject)
        parts = []
        for content, encoding in decoded_parts:
            if isinstance(content, bytes):
                parts.append(content.decode(encoding or "utf-8", errors="replace"))
            else:
                parts.append(str(content))
        return "".join(parts)
    except: return str(raw_subject)

@app.route('/api/fetch-mail', methods=['POST'])
def fetch_mail():
    data = request.json
    try:
        mail = imaplib.IMAP4_SSL(data.get('server'))
        mail.login(data.get('email'), data.get('password'))
        mail.select(data.get('folder', 'INBOX'))
        _, unseen_messages = mail.search(None, "UNSEEN")
        unseen_ids = unseen_messages[0].split()
        
        _, all_messages = mail.search(None, "ALL")
        if not all_messages[0]: return jsonify({"emails": [], "unreadCount": 0})
        
        ids = all_messages[0].split()[-20:]
        results = []
        for e_id in reversed(ids):
            _, msg_data = mail.fetch(e_id, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            results.append({
                "id": e_id.decode(),
                "from": msg.get("From") or "Unknown",
                "subject": get_decoded_subject(msg.get("Subject")),
                "date": msg.get("Date") or "",
                "unseen": e_id in unseen_ids
            })
        
        mail.logout()
        return jsonify({
            "emails": results,
            "unreadCount": len(unseen_ids)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fetch-body', methods=['POST'])
def fetch_body():
    data = request.json
    try:
        mail = imaplib.IMAP4_SSL(data.get('server'))
        mail.login(data.get('email'), data.get('password'))
        mail.select(data.get('folder', 'INBOX'))
        
        msg_id = str(data.get('index'))
        _, msg_data = mail.fetch(msg_id, "(RFC822)")
        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email)
        
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode(errors="replace")
                    break
        else:
            body = msg.get_payload(decode=True).decode(errors="replace")
            
        mail.logout()
        return jsonify({"body": body or "No text content found."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)