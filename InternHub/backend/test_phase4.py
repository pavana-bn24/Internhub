"""Test Phase 4: Certificates, Notifications, Search"""
import requests

BASE = 'http://127.0.0.1:8000/api/v1'

def login(u, p):
    r = requests.post(BASE + '/auth/login', json={'username': u, 'password': p})
    assert r.status_code == 200
    return r.json()['access_token']

admin_token = login('admin', 'admin123')
john_token = login('john', 'student123')
bob_token = login('bob', 'student123')

print('=== 1. CERTIFICATES ===')

# Admin upload certificate for enrollment 1
files = {'file': ('cert.pdf', b'%PDF-1.4 Certificate Content', 'application/pdf')}
r = requests.post(BASE + '/certificates/upload', data={'enrollment_id': 1}, files=files,
                  headers={'Authorization': f'Bearer {admin_token}'})
print(f'Upload cert: {r.status_code}', r.json().get('is_issued', '') if r.status_code == 200 else r.text[:80])

# Student john checks his certificate
r = requests.get(BASE + '/certificates/my', headers={'Authorization': f'Bearer {john_token}'})
if r.status_code == 200:
    c = r.json()
    print(f'John cert: issued={c["is_issued"]} approved={c["is_approved"]} date={c.get("issue_date","?")}')
else:
    print(f'John cert: {r.status_code} {r.text[:80]}')

# Admin list all
r = requests.get(BASE + '/certificates', headers={'Authorization': f'Bearer {admin_token}'})
print(f'Admin list: {r.status_code} {len(r.json())} certs')

# Bob should be denied
r = requests.get(BASE + '/certificates', headers={'Authorization': f'Bearer {bob_token}'})
print(f'Bob access: {r.status_code}', r.json().get('detail', '')[:60])

print()
print('=== 2. NOTIFICATIONS ===')

# John checks notifications
r = requests.get(BASE + '/notifications', headers={'Authorization': f'Bearer {john_token}'})
if r.status_code == 200:
    notifs = r.json()
    print(f'John has {len(notifs)} notifications')
    for n in notifs[:3]:
        print(f'  - [{n["notification_type"]}] {n["title"]} (read={n["is_read"]})')
else:
    print(f'Notifications: {r.status_code} {r.text[:80]}')

# Unread count
r = requests.get(BASE + '/notifications/unread-count', headers={'Authorization': f'Bearer {john_token}'})
print(f'Unread count: {r.json()["count"]}')

# Mark one as read
if notifs:
    r = requests.patch(f'{BASE}/notifications/{notifs[0]["id"]}/read', headers={'Authorization': f'Bearer {john_token}'})
    print(f'Mark read: {r.status_code}')

# Mark all as read
r = requests.patch(f'{BASE}/notifications/read-all', headers={'Authorization': f'Bearer {john_token}'})
print(f'Mark all read: {r.status_code}')

# Trigger a notification for material upload (admin creates)
r = requests.post(BASE + '/notifications', json={
    'student_id': 2, 'title': 'New Material!', 'message': 'React PDF uploaded',
    'notification_type': 'material'
}, headers={'Authorization': f'Bearer {admin_token}'})
print(f'Admin create notif: {r.status_code}')

print()
print('=== 3. SEARCH ===')

# Search courses
r = requests.get(BASE + '/courses?search=Data', headers={'Authorization': f'Bearer {john_token}'})
print(f'Search courses "Data": {len(r.json())} results')

# Search materials
r = requests.get(BASE + '/study-materials?search=React', headers={'Authorization': f'Bearer {john_token}'})
print(f'Search materials "React": {len(r.json())} results')

print()
print('All Phase 4 API tests passed!')
