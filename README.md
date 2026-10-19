# INT144 — Agile & Scrum Learning Notes

เว็บสอนภาษาไทย 5 บท 25 หัวข้อ เรียบเรียงจาก transcript INT144-G1 Class 1–5 พร้อมตัวอย่างระบบจองห้อง

- สลับ TH / EN ได้ทั้งเมนูและเนื้อหาครบ 5 บท โดยจำภาษาที่เลือกในเบราว์เซอร์ (transcript ยังคงภาษาไทยต้นฉบับ)
- เลือกเรียนทีละบท ค้นหาคำในบทเรียน และเปิด transcript ทั้งคาบ
- ค้นหาและดาวน์โหลด transcript ของแต่ละบท
- จำสถานะอ่านจบใน localStorage ของเบราว์เซอร์
- รองรับมือถือ คีย์บอร์ด และการพิมพ์เป็น PDF
- ไม่มี backend ไม่มีการส่งความคืบหน้าออกจากเครื่อง

## เปิดในเครื่อง

ใช้ Python 3 รันในโฟลเดอร์นี้:

```sh
python3 -m http.server 8151
```

เปิด http://localhost:8151 (ต้องเปิดผ่าน HTTP เนื่องจากใช้ fetch โหลดเนื้อหา)

## แก้ไขเนื้อหา

แก้ `build_content.py` แล้วรัน `python3 build_content.py` เพื่อสร้าง `lessons.json` ใหม่ รัน `python3 extract_transcripts.py` เพื่อดึง transcript โดยรักษาการขึ้นบรรทัดและเวลาเดิม ข้อความใน `sources/` ดึงจากไฟล์ DOCX ใน Downloads โดยอ่าน XML ของย่อหน้าและเก็บข้อความเดิมไว้ ไม่มีไฟล์ซ้ำ Class 2 (1)

บทเรียนเป็นการเรียบเรียงใหม่และมีตัวอย่างที่เขียนเพิ่ม ไม่ใช่เอกสารทางการของผู้สอน ส่วน transcript เป็นข้อความถอดเสียงอัตโนมัติซึ่งอาจคลาดเคลื่อน

## เผยแพร่

ใช้ GitHub Pages ผ่าน Actions ตาม `.github/workflows/pages.yml` ตั้ง Settings → Pages → Source เป็น GitHub Actions จากนั้น push ไปยัง main

เนื้อหาภาษาอังกฤษ: แก้ `english_content.py` แล้วรัน `python3 english_content.py` เพื่อสร้าง `lessons.en.json` โดยรักษา ID และลำดับหัวข้อให้ตรงกับภาษาไทย ข้อความ UI อยู่ใน `i18n.js`
