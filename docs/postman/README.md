# StudyVault Postman API Tests

Thu muc nay chua bo test API day du cho StudyVault hien tai.

## Files

- `StudyVault_API_Full.postman_collection.json`: Postman collection chay full luong API.
- `StudyVault_Local.postman_environment.json`: Postman environment mau cho local Docker/local backend.
- `fixtures/studyvault-sample.txt`: file TXT hop le de test upload.
- `fixtures/fake.pdf`: file gia PDF de test upload hardening.

## Cach dung trong Postman

1. Import collection `StudyVault_API_Full.postman_collection.json`.
2. Import environment `StudyVault_Local.postman_environment.json`.
3. Chon environment `StudyVault Local`.
4. Sua cac bien quan trong:
   - `baseUrl`: mac dinh `http://localhost:8000/api`.
   - `userEmail`, `userPassword`: tai khoan user da verify.
   - `userBEmail`, `userBPassword`: tai khoan user thu hai da verify, dung de test ownership.
   - `adminEmail`, `adminPassword`: tai khoan admin.
   - `documentFilePath`, `fakePdfFilePath`: neu Postman khong doc duoc relative path, hay chon file thu cong trong request upload.
5. Mo Collection Runner va chay tu folder `00 - Setup & System` den `09 - Cleanup`.

## Yeu cau truoc khi chay full

- Backend dang chay va ket noi database thanh cong.
- Co it nhat 1 admin va 2 user thuong da verify email.
- Neu test AI/RAG can pass success 200 thi can cau hinh API key AI va quota con du.
- Neu AI het quota hoac chua cau hinh, folder `06 - RAG & AI Branches` va endpoint `/llm/test` co test mem: chap nhan response loi co y nghia thay vi fail ca bo collection.

## Cac nhanh da bao phu

- System: root API, health.
- Auth public: register, validation, login sai, forgot password neutral, resend verification neutral, invalid token.
- Session: login, refresh token + CSRF, refresh thieu CSRF bi chan.
- Profile: get/update, doi password sai current password.
- Folder: list/create/get/update/move/legacy update/invalid UUID.
- Tag: list/create/update/filter/invalid color.
- Document: list/upload/upload fake file/get/file/update name/update tags/favorite/search/related/delete.
- Note: list/create/update/delete.
- RAG: ask/history/summary/mindmap/diagram/clear history.
- Authorization: unauthenticated bi chan, User B khong doc/sua data cua User A, user thuong khong goi admin.
- Admin: stats/list users/audit logs/lock-unlock user/self-lock blocked/LLM admin endpoint.
- Cleanup: xoa note/document/tag/folder va logout.

## Luu y

- Request `Admin locks User B` se khoa tam thoi tai khoan User B, request ke tiep se mo khoa lai. Nen dung tai khoan test, khong dung tai khoan ca nhan quan trong.
- Request upload trong Postman app co the can ban chon lai file bang UI vi Postman han che duong dan file local khi import.
- Script sinh collection nam o `scripts/generate-postman-collection.js`. Chay lai bang:

```powershell
node scripts/generate-postman-collection.js
```
