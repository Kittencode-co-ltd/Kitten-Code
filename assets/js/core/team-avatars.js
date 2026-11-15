/**
 * Kitten Code — Team Profile Image Resolver
 * Maps back-office user records to their official portrait on the main website
 * (index.html #team & team-profile/*.html) using strict whole-word name and email matching.
 */

export const TEAM_MEMBERS = [
    {
        id: 'pimsiree',
        fullName: 'Pimsiree Anurakchanachai',
        firstNames: ['pimsiree', 'pansiree', 'พิมพ์สิรี', 'พิมพ์ศิริ'],
        lastNames: ['anurakchanachai', 'อนุรักษ์ชนะชัย'],
        emails: ['pansiree0231@gmail.com'],
        avatar: '../assets/img/team/team-1.jpg'
    },
    {
        id: 'natchanon',
        fullName: 'Natchanon Jaruteekampron',
        firstNames: ['natchanon', 'ณัชชานนท์'],
        lastNames: ['jaruteekampron', 'jaruteekamporn', 'จารุฑีฆัมพร'],
        emails: ['j.natchanon.93@gmail.com'],
        avatar: '../assets/img/team/team-2.jpg'
    },
    {
        id: 'supawit',
        fullName: 'Supawit Kongboon',
        firstNames: ['supawit', 'ศุภวิชญ์'],
        lastNames: ['kongboon', 'คงบุญ'],
        emails: ['supawitko03@gmail.com'],
        avatar: '../assets/img/team/team-3.jpg'
    },
    {
        id: 'chaiyakan',
        fullName: 'Chaiyakan Jaitrongkla',
        firstNames: ['chaiyakan', 'ชัยกานต์'],
        lastNames: ['jaitrongkla', 'ใจตรงกล้า'],
        emails: [],
        avatar: '../assets/img/team/team-4.jpg'
    },
    {
        id: 'paphawadee',
        fullName: 'Paphawadee Buakao',
        firstNames: ['paphawadee', 'ปภาวดี'],
        lastNames: ['buakao', 'บัวขาว'],
        emails: ['paphawadeebm@gmail.com'],
        avatar: '../assets/img/team/team-8.jpg'
    },
    {
        id: 'yanisa',
        fullName: 'Yanisa Kantaping',
        firstNames: ['yanisa', 'ญาณิศา'],
        lastNames: ['kantaping', 'kanthaping', 'กันทะปิง'],
        emails: ['yanisakantaping@gmail.com'],
        avatar: '../assets/img/team/rd-aim.png'
    },
    {
        id: 'chanon',
        fullName: 'Chanon Seubsai-on',
        firstNames: ['chanon', 'ชานนท์'],
        lastNames: ['seubsai-on', 'seubsaion', 'สืบสายอ่อน'],
        emails: ['chanon6103@gmail.com'],
        avatar: '../assets/img/team/co-rd-neem.png'
    },
    {
        id: 'patcharee',
        fullName: 'Patcharee Hongthong',
        firstNames: ['patcharee', 'พัชรี'],
        lastNames: ['hongthong', 'หงษ์ทอง'],
        emails: ['pathon@kku.ac.th'],
        avatar: '../assets/img/team/advisor-1.png'
    }
];

function normalizeToken(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\b(ph\.?d\.?|dr\.?|mr\.?|ms\.?|mrs\.?|นาย|นางสาว|นาง|ดร\.)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Resolves the team portrait path for a user object.
 * Uses strict whole-token matching so similar names (e.g. "Natchanon" vs "Chanon")
 * never collide.
 *
 * @param {Object} user - { firstName, lastName, fullName, name, displayName, email, photoURL }
 * @returns {string|null} Relative image path (`../assets/img/team/...`) or null if no match.
 */
export function resolveTeamAvatar(user = {}) {
    if (!user || typeof user !== 'object') return null;

    if (user.photoURL && String(user.photoURL).trim()) {
        return String(user.photoURL).trim();
    }

    let first = normalizeToken(user.firstName);
    let last = normalizeToken(user.lastName);

    const combinedRaw = normalizeToken(
        user.fullName || user.name || user.displayName || `${first} ${last}`
    );
    const words = combinedRaw ? combinedRaw.split(' ').filter(Boolean) : [];

    if (!first && words.length >= 1) {
        first = words[0];
    }
    if (!last && words.length >= 2) {
        last = words.slice(1).join(' ');
    }

    // 1. Strict First Name + Last Name match (highest confidence)
    if (first && last) {
        const exactBoth = TEAM_MEMBERS.find(
            m => m.firstNames.includes(first) && m.lastNames.includes(last)
        );
        if (exactBoth) return exactBoth.avatar;
    }

    // 2. Strict First Name match when Last Name is not conflicting
    if (first) {
        const firstMatch = TEAM_MEMBERS.find(
            m => m.firstNames.includes(first) && (!last || m.lastNames.includes(last))
        );
        if (firstMatch) return firstMatch.avatar;
    }

    // 3. Exact Email match
    const email = String(user.email || '').trim().toLowerCase();
    if (email) {
        const emailMatch = TEAM_MEMBERS.find(m => m.emails.includes(email));
        if (emailMatch) return emailMatch.avatar;
    }

    // 4. Strict token match when full name has both tokens in any order
    if (words.length >= 2) {
        const tokenMatch = TEAM_MEMBERS.find(
            m =>
                words.some(w => m.firstNames.includes(w)) &&
                words.some(w => m.lastNames.includes(w))
        );
        if (tokenMatch) return tokenMatch.avatar;
    }

    // 5. Single-word exact First Name match (only if no conflicting last name)
    if (words.length === 1) {
        const singleMatch = TEAM_MEMBERS.find(m => m.firstNames.includes(words[0]));
        if (singleMatch) return singleMatch.avatar;
    }

    return null;
}
