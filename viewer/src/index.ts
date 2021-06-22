import { CritterData } from './critter';
import { GVars } from './state';
import { UI } from './ui';

CritterData.Load(() => {
    GVars.init();
    UI.init();
});