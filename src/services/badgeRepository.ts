import { peopleRepository } from './peopleRepository';
import { requireSupabase } from './supabase';
import { createPrivateDocumentUrl, uploadPrivateDocument } from './documentStorage';

export interface BadgeRecord { id: string; employeeId: string; name: string; department: string; employeeNumber: string; photoPath: string | null; photoUrl: string | null }

export const badgeRepository = {
  async list(): Promise<BadgeRecord[]> {
    const client = requireSupabase();
    const [badges, people] = await Promise.all([client.from('badges').select('*').eq('active', true), peopleRepository.listEmployees()]);
    if (badges.error) throw badges.error;
    const employees = new Map(people.map((person) => [person.id, person]));
    return Promise.all((badges.data ?? []).map(async (row) => {
      const employee = employees.get(row.employee_id);
      return {
        id: row.id, employeeId: row.employee_id, name: row.display_name, department: row.department_name,
        employeeNumber: employee?.matricula ?? '', photoPath: row.photo_path,
        photoUrl: row.photo_path ? await createPrivateDocumentUrl(row.photo_path) : null,
      };
    }));
  },

  async save(input: { employeeId: string; name: string; department: string; photo?: File | null; previousPhotoPath?: string | null }) {
    const client = requireSupabase();
    let photoPath = input.previousPhotoPath ?? null;
    if (input.photo) photoPath = await uploadPrivateDocument('badges', input.employeeId, input.photo);
    const { error } = await client.from('badges').upsert({ employee_id: input.employeeId, display_name: input.name, department_name: input.department, photo_path: photoPath, active: true }, { onConflict: 'employee_id' });
    if (error) throw error;
  },
};