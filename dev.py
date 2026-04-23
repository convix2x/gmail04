from flask import Flask, send_from_directory, request, jsonify
from api.index import app as api_app

app = Flask(__name__, static_folder='public')

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

@app.route('/api/fetch-body', methods=['POST'])
def proxy_fetch_body():
    with api_app.test_request_context(
        path='/api/fetch-body',
        method='POST',
        json=request.json
    ):
        return api_app.full_dispatch_request()

@app.route('/api/fetch-mail', methods=['POST'])
def proxy_api():
    with api_app.test_request_context(
        path='/api/fetch-mail',
        method='POST',
        json=request.json
    ):
        return api_app.full_dispatch_request()



if __name__ == "__main__":
    print("Dev server running at http://localhost:5000")
    app.run(port=5000, debug=True)