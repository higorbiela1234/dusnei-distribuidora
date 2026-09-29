import { requireSupabase } from './supabase';

export async function uploadPrivateDocument(ownerType: string, ownerId: string, file: File) {
  if (!['aso', 'medical-certificates', 'disciplinary-records', 'employees', 'badges'].includes(ownerType)) {
    throw new Error('Categoria de documento inválida.');
  }
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Formato não permitido. Envie PDF, JPG ou PNG.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('O documento deve ter até 10 MB.');
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${ownerType}/${ownerId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await requireSupabase().storage.from('hr-documents').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function createPrivateDocumentUrl(path: string, expiresInSeconds = 300) {
  const { data, error } = await requireSupabase().storage.from('hr-documents').createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}