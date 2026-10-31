# Hesap, eşitleme ve yapay zeka kurulumu (bir kere, ~10 dk)

Bu olmadan uygulama yine çalışır ama hesapsızdır (veri sadece o telefonda) ve yapay zeka kapalıdır.

1. https://supabase.com → ücretsiz proje aç.
2. **SQL Editor**'de çalıştır:
```sql
create table planim_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table planim_state enable row level security;
create policy "kendi verisi" on planim_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
3. **Authentication → Email Templates** altında **Magic Link** VE **Confirm signup** şablonlarının ikisine de kodu göster: içeriğe `{{ .Token }}` ekle
   (örn. "Pusulam giriş kodun: {{ .Token }}"). Giriş 6 haneli kodla yapılır. Yeni kayıt olanlara **Confirm signup**, mevcut hesaplara **Magic Link** şablonu gider; birine eklemezsen o kullanıcılar kod göremez.
4. **Project Settings → API**: `Project URL` ve `anon public` anahtarı → `config.ts` içindeki `supabaseUrl` ve `supabaseAnonKey`.
5. (Artık gerekmez: yapay zeka, Ayarlar > Yapay zeka'ya yazılan Gemini anahtarıyla çalışır.) Eski Supabase yapay zeka işlevi:
```
npm i -g supabase
supabase login && supabase link --project-ref <proje-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy planim-ai
```
Anthropic anahtarı yalnızca sunucuda kalır, APK'nın içine girmez.
6. APK'yı yeniden derle.

Not: Supabase ücretsiz planında günde birkaç e-posta sınırı vardır; çok kullanıcı için kendi SMTP'ni bağla.
