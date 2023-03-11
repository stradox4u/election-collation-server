import { seeder } from 'nestjs-seeder';
import { DayjsModule } from './dayjs/dayjs.module';
import { ElectionSeeder } from './seeders/election.seeder';

seeder({
  imports: [DayjsModule],
}).run([ElectionSeeder]);
