# v20 üzerine yapılan değişiklikler

Yeni: lib/lessonConflict.ts, lib/parentLock.ts, reklam-yedek/ads.ts.txt
Değişen: app/(tabs)/schedule.tsx, app/ai-schedule.tsx, app/member.tsx, app/_layout.tsx, app/settings.tsx, app/locked-apps.tsx,
components/AiKeyCard.tsx, components/LockedAppsEditor.tsx, components/Onboarding.tsx, components/PermissionsCard.tsx, components/GradePicker.tsx,
components/Consent.tsx, constants/privacy.ts (sürüm 13), lib/ai.ts, lib/ads.ts (reklamsız), lib/schedule.ts, config.ts, types/planim.ts,
.github/workflows/build-apk-direct.yml, android-yayin/01 ve 03.

1. Sınıf listesi: yalnızca Mezun ve 8. Sınıf.
2. Reklamlar kapalı (lib/ads.ts boş sürüm; eski kod reklam-yedek/ads.ts.txt).
3. Yapay zeka: ebeveyn PIN'i + aç/kapa (18 yaş altı başta kapalı). Kontrol lib/ai.ts gemini() içinde, tüm yapay zeka ekranlarını kapsar.
4. Kilit listesi: "Kilitlenecek" görünümü, başta hepsi seçili, "Tümünü seç / Seçimi temizle".
5. Aynı gün ve saatte ders çakışması engellenir (elle ekleme, düzenleme, yapay zeka programı, öğretmenden gelen program).
6. Ana sayfa üst çubuğunda ismin yanında rozetler (components/TopBar.tsx).
7. Hesap silme artık çalışma odalarını ve oda içi durumu da siler (lib/account.ts). firestore.rules değişti: Firebase Console > Firestore > Kurallar'dan yeniden yayınla.
8. Ders saati doğrulaması: bitiş başlangıçtan sonra olmalı (elle ekleme ve yapay zekâ/öğretmen programı).
9. Çakışan program: yapay zekâ ya da öğretmen programı mevcut derslerle çakışırsa soruyor; hangi mevcut derslerin silinip yenisinin ekleneceğini seçtiriyor (components/PlanConflictModal.tsx).
10. LGS 2027 tarihi 13 Haziran 2027 (MEB takvimi); 2026 de eklendi (lib/lgs.ts).
11. Mola: süren molayı bitirmeden ikinci mola başlatınca geçen süre kayboluyordu, düzeltildi; mola sırasında menüde "Molayı bitir" çıkar; mola sırasında uygulama yeniden açılırsa kilit servisinin bitiş saati doğru kurulur (app/study-mode.tsx).
12. Ders sürerken uygulama son uygulamalardan silinirse: kilit servisi uygulamayı yeniden açar (LockService.kt onTaskRemoved) ve StudyResume çalışma ekranına geri döndürür. YENİDEN DERLEME GEREKİR (yerel kod değişti).
13. Okul seçiciye "listede yoksa yaz, olarak ekle" ipucu (components/SchoolPicker.tsx).
14. Sohbet: başkasının mesajı silinemez; sınıf grubunda grubu kuran öğretmen herkesin mesajını silebilir (app/chat-room.tsx + firestore.rules, kurallar yeniden yayınlanmalı). Sohbet ekranı WhatsApp benzeri yapıldı (yeşil/koyu başlık, mesaj balonları, saat ve tik, gruplanan mesajlar, yuvarlak yazı kutusu).
15. LGS 2027 = 13 Haziran 2027 kesin. Eski kayıtlı 'tahmini' tarih artık sayaçta kullanılmıyor, yıl seçiliyse tarih her zaman lib/lgs.ts tablosundan geliyor.
16. Eski çalışma odaları: kapanmış ya da 3 saatten eski odalar uygulama açılırken otomatik silinir (lib/rooms.ts cleanupRooms, app/_layout.tsx). firestore.rules yayınlanmalı.
17. Gizlilik metni sürüm 13: mesaj silme yetkisi (herkes kendi mesajını, sınıfta öğretmen hepsini), oda kayıtlarının silinmesi eklendi; "rozetler sunucuya gönderilmez" yanlışı düzeltildi. İlk açılışta onay ekranı bir kez daha çıkar.
18. Öğretmen sınıf sohbetinde grup bilgisinden üye çıkarabilir (zaten vardı, app/chat-room.tsx). Çıkarılan öğrenci sınıf koduyla tekrar katılabilir (bilinen sınır).
