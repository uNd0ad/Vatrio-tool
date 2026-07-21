insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists listing_images_public_read on storage.objects;
create policy listing_images_public_read
  on storage.objects for select to public
  using (bucket_id = 'listing-images');

-- Notă: storage.buckets aparține rolului supabase_storage_admin, deci un
-- COMMENT ON de aici eșuează cu "must be owner" (42501). Bucketul
-- listing-images ține thumbnail-urile publice oglindite ale anunțurilor.
