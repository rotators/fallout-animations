export class FalloutAnimation {
    // ... read from JSON
    public static CodeDescriptionJSON(code: string) {

    }

    public static CodeDescription(code: string) {
        switch(code) {
            case 'AA': return 'Unarmed - Stand';
            case 'AB': return 'Unarmed - Walk';
            case 'AE': return 'Climb ladder';
            case 'AG': return 'Up stairs right';
            case 'AH': return 'Up stairs left';
            case 'AI': return 'Down stairs right';
            case 'AJ': return 'Down stairs left';
            case 'AK': return 'Magic hands ground';
            case 'AL': return 'Magic hands middle';
            case 'AN': return 'Unarmed - Doge';
            case 'AO': return 'Hit from front';
            case 'AP': return 'Hit from back';
            case 'AQ': return 'Throw punch';
            case 'AR': return 'Kick leg';
            case 'AS': return 'Throwing';
            case 'AT': return 'Running';

            case 'BA': return 'Fall back';
            case 'BB': return 'Fall front';
            case 'BC': return 'Bad landing';
            case 'BD': return 'Big hole';
            case 'BE': return 'Charred body';
            case 'BF': return 'Chunks of flesh';
            case 'BG': return 'Dancing autofire';
            case 'BH': return 'Electrify';
            case 'BI': return 'Sliced in half';
            case 'BJ': return 'Burned to nothing';
            case 'BK': return 'Electrified to nothing';
            case 'BL': return 'Exploded to nothing';
            case 'BM': return 'Melted to nothing';
            case 'BN': return 'Fire dance';
            case 'BO': return 'Fall back blood';
            case 'BP': return 'Fall front blood';

            case 'CH': return 'Prone to standing';
            case 'CJ': return 'Back to standing';

            case 'DA': return 'Knife - Stand';
            case 'DB': return 'Knife - Walk';
            case 'DC': return 'Knife - Draw';
            case 'DD': return 'Knife - Holster';
            case 'DE': return 'Knife - Dodge ';
            case 'DF': return 'Knife - Thrust';
            case 'DG': return 'Knife - Swing';
            case 'DM': return 'Knife - Throw';

            case 'EA': return 'Club - Stand';
            case 'EB': return 'Club - Walk';
            case 'EC': return 'Club - Draw';
            case 'ED': return 'Club - Holster';
            case 'EE': return 'Club - Dodge';
            case 'EF': return 'Club - Thrust';
            case 'EG': return 'Club - Swing';

            case 'FA': return 'Hammer - Stand';
            case 'FB': return 'Hammer - Walk';
            case 'FC': return 'Hammer - Draw';
            case 'FD': return 'Hammer - Holster';
            case 'FE': return 'Hammer - Dodge';
            case 'FF': return 'Hammer - Thrust';
            case 'FG': return 'Hammer - Swing';

            case 'GA': return 'Spear - Stand';
            case 'GB': return 'Spear - Walk';
            case 'GC': return 'Spear - Draw';
            case 'GD': return 'Spear - Holster';
            case 'GE': return 'Spear - Dodge';
            case 'GF': return 'Spear - Thrust';
            case 'GM': return 'Spear - Throwing';

            case 'HA': return 'Pistol - Stand';
            case 'HB': return 'Pistol - Walk';
            case 'HC': return 'Pistol - Draw';
            case 'HD': return 'Pistol - Holster';
            case 'HE': return 'Pistol - Dodge';
            case 'HH': return 'Pistol - Weapon Up';
            case 'HI': return 'Pistol - Weapon Down';
            case 'HJ': return 'Pistol - Fire single';
            case 'HK': return 'Pistol - Fire burst';
            case 'HL': return 'Pistol - Fire continuous';

            case 'IA': return 'SMG - Stand';
            case 'IB': return 'SMG - Walk';
            case 'IC': return 'SMG - Draw';
            case 'ID': return 'SMG - Holster';
            case 'IE': return 'SMG - Dodge';
            case 'IH': return 'SMG - Weapon Up';
            case 'II': return 'SMG - Weapon Down';
            case 'IJ': return 'SMG - Fire single';
            case 'IK': return 'SMG - Fire burst';
            case 'IL': return 'SMG - Fire continuous';

            case 'JA': return 'Rifle - Stand';
            case 'JB': return 'Rifle - Walk';
            case 'JC': return 'Rifle - Draw';
            case 'JD': return 'Rifle - Holster';
            case 'JE': return 'Rifle - Dodge';
            case 'JH': return 'Rifle - Weapon Up';
            case 'JI': return 'Rifle - Weapon Down';
            case 'JJ': return 'Rifle - Fire single';
            case 'JK': return 'Rifle - Fire burst';
            case 'JL': return 'Rifle - Fire continuous';

            case 'KA': return 'Big Gun - Stand';
            case 'KB': return 'Big Gun - Walk';
            case 'KC': return 'Big Gun - Draw';
            case 'KD': return 'Big Gun - Holster';
            case 'KE': return 'Big Gun - Dodge';
            case 'KH': return 'Big Gun - Weapon Up';
            case 'KI': return 'Big Gun - Weapon Down';
            case 'KJ': return 'Big Gun - Fire single';
            case 'KK': return 'Big Gun - Fire burst';
            case 'KL': return 'Big Gun - Fire continuous';

            case 'LA': return 'Minigun - Stand';
            case 'LB': return 'Minigun - Walk';
            case 'LC': return 'Minigun - Draw';
            case 'LD': return 'Minigun - Holster';
            case 'LE': return 'Minigun - Dodge';
            case 'LH': return 'Minigun - Weapon Up';
            case 'LI': return 'Minigun - Weapon Down';
            case 'LJ': return 'Minigun - Fire single';
            case 'LK': return 'Minigun - Fire burst';
            case 'LL': return 'Minigun - Fire continuous';

            case 'MA': return 'Rocket Launcher - Stand';
            case 'MB': return 'Rocket Launcher - Walk';
            case 'MC': return 'Rocket Launcher - Draw';
            case 'MD': return 'Rocket Launcher - Holster';
            case 'ME': return 'Rocket Launcher - Dodge';
            case 'MH': return 'Rocket Launcher - Weapon Up';
            case 'MI': return 'Rocket Launcher - Weapon Down';
            case 'MJ': return 'Rocket Launcher - Fire single';
            case 'MK': return 'Rocket Launcher - Fire burst';
            case 'ML': return 'Rocket Launcher - Fire continuous';

            case 'RA': return 'Fall back (single frame)';
            case 'RB': return 'Fall front (single frame)';
            case 'RC': return 'Bad landing (single frame)';
            case 'RD': return 'Big hole (single frame)';
            case 'RE': return 'Charred body (single frame)';
            case 'RF': return 'Chunks of flesh (single frame)';
            case 'RG': return 'Dancing autofire (single frame)';
            case 'RH': return 'Electrify (single frame)';
            case 'RI': return 'Siled in half (single frame)';
            case 'RJ': return 'Burned to nothing (single frame)';
            case 'RK': return 'Electrified to nothing (single frame)';
            case 'RL': return 'Exploded to nothing (single frame)';
            case 'RM': return 'Melted to nothing (single frame)';
            case 'RO': return 'Fall back blood (single frame)';
            case 'RP': return 'Fall front blood (single frame)';
            case 'RN': return 'Called shot pic';
        }
    }
}

