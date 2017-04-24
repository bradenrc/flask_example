

import urllib3, requests, json, os

id = "09171b0e-d473-4f0e-9d11-73bcd330ca67"
version = "https://ibm-watson-ml.mybluemix.net/v2/artifacts/models/09171b0e-d473-4f0e-9d11-73bcd330ca67/versions/7e684513-a525-4510-90d5-a87ba6d22ab7"

service_path = 'https://ibm-watson-ml.mybluemix.net'
username = "35f91983-2730-4f14-8f4c-b821bf7c4c5a"
password = "babcc6ca-c50e-414a-8cc3-535afb5f1fb8"

headers = urllib3.util.make_headers(basic_auth='{}:{}'.format(username, password))
url = '{}/v2/identity/token'.format(service_path)
response = requests.get(url, headers=headers)
mltoken = json.loads(response.text).get('token')

header_online = {'Content-Type': 'application/json', 'Authorization': mltoken}
scoring_href = "https://ibm-watson-ml.mybluemix.net/32768/v2/scoring/2080"

gender = "M"
age = 55
marital = "Single"
job = "Executive"
payload_scoring = {"record":[gender, age, marital, job]}

response_scoring = requests.put(scoring_href, json=payload_scoring, headers=header_online)
result = response_scoring.text
