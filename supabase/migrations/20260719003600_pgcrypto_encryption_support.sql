-- Enable pgcrypto extension and encryption helper functions for sensitive fields

create extension if not exists pgcrypto;

create or replace function public.encrypt_sensitive_text(plain_text text, secret_key text)
returns text
language plpgsql
security definer
as $$
begin
  if plain_text is null then return null; end if;
  return encode(pgp_sym_encrypt(plain_text, secret_key), 'base64');
end;
$$;

create or replace function public.decrypt_sensitive_text(cipher_text text, secret_key text)
returns text
language plpgsql
security definer
as $$
begin
  if cipher_text is null then return null; end if;
  return pgp_sym_decrypt(decode(cipher_text, 'base64'), secret_key);
end;
$$;

comment on function public.encrypt_sensitive_text is
  'Encrypts sensitive text data using pgcrypto symmetric encryption.';
comment on function public.decrypt_sensitive_text is
  'Decrypts symmetric ciphertext using pgcrypto.';
