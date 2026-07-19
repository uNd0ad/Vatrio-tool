export interface ReferentialIntegrityIssue {
  table: string;
  foreignKey: string;
  orphanedId: string;
}

export function checkReferentialIntegrity(data?: { listings?: any[]; photos?: any[]; notes?: any[] }): ReferentialIntegrityIssue[];
