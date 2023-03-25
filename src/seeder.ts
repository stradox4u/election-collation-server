import { seeder } from 'nestjs-seeder';
import { DayjsModule } from './dayjs/dayjs.module';
import { PrismaModule } from './prisma/prisma.module';
import { PartySeeder } from './seeders/party.seeder';
import { PollingUnitSeeder } from './seeders/pollingunit.seeder';
import { WardSeeder } from './seeders/wards.seeder';

seeder({
  imports: [DayjsModule, PrismaModule],
}).run([PollingUnitSeeder, WardSeeder, PartySeeder]);
