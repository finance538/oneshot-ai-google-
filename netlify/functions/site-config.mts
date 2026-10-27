// netlify/functions/site-config.mts
// الواجهة العامة لإعدادات المنظومة: يُقرأ منها الشريط الإعلاني العام وحالة النطاقات
// ومفاتيح الأدوات — دون أي بيانات حساسة — ليطبقها أي نطاق فرعي فوراً دون نشر جديد.

import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { adminConfig } from '../../db/schema.js';
import { reply } from '../lib/platform.js';
import { defaultSuperAdminConfig, type SuperAdminConfig } from '../../shared/superadmin.js';

export default async () => {
  try {
    const [row] = await database().select().from(adminConfig).where(eq(adminConfig.id, 'global')).limit(1);
    let config: SuperAdminConfig = defaultSuperAdminConfig;
    if (row?.config && typeof row.config === 'object') {
      config = { ...defaultSuperAdminConfig, ...(row.config as Partial<SuperAdminConfig>) };
    }
    // السطح العام فقط — لا أسعار داخلية ولا مفاتيح.
    return reply({
      banner: config.banner,
      subdomains: config.subdomains,
      tools: config.tools,
      commercial: config.commercial,
    });
  } catch {
    return reply({ banner: defaultSuperAdminConfig.banner, subdomains: defaultSuperAdminConfig.subdomains, tools: defaultSuperAdminConfig.tools, commercial: false });
  }
};
