import { seeder } from 'nestjs-seeder';
import { DayjsModule } from './dayjs/dayjs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ElectionSeeder } from './seeders/election.seeder';
import { WardSeeder } from './seeders/wards.seeder';

seeder({
  imports: [DayjsModule, PrismaModule],
}).run([ElectionSeeder, WardSeeder]);
