// IMS registers (ISO 9001 / 14001 / 27001 / 56001 shared core): one config-driven page.
// Everyone on staff can read; admins maintain. Policies also collect each person's acknowledgement.
import { db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from '../core/firebase-config.js';
import { requireUser, esc, isoDate, thDate, toast, openModal, closeModal } from '../core/session.js';

const $ = (id) => document.getElementById(id);
const STD = [['9001', 'ISO 9001'], ['14001', 'ISO 14001'], ['27001', 'ISO 27001'], ['56001', 'ISO 56001']];
const lv = (n) => [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']].map(([v]) => [v, v]);
const std = { k: 'standards', label: 'มาตรฐานที่เกี่ยวข้อง', type: 'tags', options: STD, full: true };
const WHO = 'ผู้รับผิดชอบ';

let me, tab = 'docs', items = {}, acks = [], users = [], editing = null;
const today = () => isoDate();

// Each register: collection, fields, how a row looks, and the stats on top.
const TABS = {
    docs: {
        group: 1, label: 'เอกสารควบคุม', icon: 'bi-file-earmark-check', col: 'ims_docs', prefix: 'dc',
        sub: 'ทะเบียนนโยบาย ขั้นตอน และแบบฟอร์ม พร้อมเวอร์ชัน ผู้อนุมัติ และวันทบทวน', noun: 'เอกสาร', history: true,
        fields: [
            { k: 'code', label: 'รหัสเอกสาร *', ph: 'เช่น QP-01' }, { k: 'title', label: 'ชื่อเอกสาร *', req: 1 },
            { k: 'dtype', label: 'ประเภท', type: 'select', options: [['policy', 'นโยบาย'], ['procedure', 'ขั้นตอนปฏิบัติ'], ['wi', 'วิธีปฏิบัติงาน'], ['form', 'แบบฟอร์ม'], ['record', 'บันทึก']] },
            { k: 'version', label: 'เวอร์ชัน', ph: '1.0', def: '1.0' },
            { k: 'status', label: 'สถานะ', type: 'select', options: [['draft', 'ร่าง'], ['review', 'รออนุมัติ'], ['approved', 'ใช้งาน'], ['obsolete', 'ยกเลิก']], def: 'draft' },
            { k: 'owner', label: WHO }, { k: 'approvedBy', label: 'ผู้อนุมัติ' }, { k: 'approvedDate', label: 'วันที่อนุมัติ', type: 'date' },
            { k: 'nextReview', label: 'ทบทวนครั้งต่อไป', type: 'date' }, { k: 'link', label: 'ลิงก์ไฟล์ (Drive ฯลฯ)', ph: 'https://…' },
            std, { k: 'changeNote', label: 'สรุปการแก้ไขรอบนี้', type: 'textarea', full: true, ph: 'เช่น เพิ่มข้อ 4.2 ตามผลตรวจภายใน' }
        ],
        title: (r) => `${r.code ? r.code + ' · ' : ''}${r.title}`,
        meta: (r) => [`v${r.version || '1.0'}`, DT[r.dtype] || '', r.owner, r.nextReview ? 'ทบทวน ' + thDate(r.nextReview) : ''],
        badge: (r) => r.status === 'approved' ? (r.nextReview && r.nextReview < today() ? ['rejected', 'เลยกำหนดทบทวน'] : ['paid', 'ใช้งาน'])
            : r.status === 'review' ? ['pending', 'รออนุมัติ'] : r.status === 'obsolete' ? ['rejected', 'ยกเลิก'] : ['pending', 'ร่าง'],
        stats: (a) => [['ทั้งหมด', a.length], ['ใช้งาน', a.filter(r => r.status === 'approved').length], ['รออนุมัติ', a.filter(r => r.status === 'review').length],
        ['เลยกำหนดทบทวน', a.filter(r => r.status === 'approved' && r.nextReview && r.nextReview < today()).length, 1]],
        lead: (r) => ['', `<b>${esc((r.code || '').split('-')[0] || 'DOC')}</b>`],
        sort: (a, b) => (a.code || a.title || '').localeCompare(b.code || b.title || '', 'th')
    },
    policies: {
        group: 1, label: 'นโยบาย / รับทราบ', icon: 'bi-patch-check', col: 'ims_policies', prefix: 'po',
        sub: 'นโยบายของบริษัท พนักงานทุกคนกดรับทราบได้เอง และผู้บริหารเห็นว่าใครยังไม่รับทราบ', noun: 'นโยบาย', ack: true,
        fields: [
            { k: 'title', label: 'ชื่อนโยบาย *', req: 1, full: true }, { k: 'version', label: 'เวอร์ชัน', def: '1.0' }, { k: 'effective', label: 'วันที่มีผลบังคับใช้', type: 'date' },
            { k: 'signedBy', label: 'ผู้ลงนาม / ผู้อนุมัติ' }, { k: 'status', label: 'สถานะ', type: 'select', options: [['active', 'ประกาศใช้'], ['draft', 'ร่าง']], def: 'draft' },
            std, { k: 'body', label: 'เนื้อหานโยบาย', type: 'textarea', full: true, rows: 9 }
        ],
        title: (r) => r.title, meta: (r) => [`v${r.version || '1.0'}`, r.effective ? 'มีผล ' + thDate(r.effective) : '', r.signedBy],
        badge: (r) => r.status !== 'active' ? ['pending', 'ร่าง'] : ackedBy(r, me.uid) ? ['paid', 'รับทราบแล้ว'] : ['pending', 'รอรับทราบ'],
        stats: (a) => { const act = a.filter(r => r.status === 'active'); const mine = act.filter(r => !ackedBy(r, me.uid)).length; return [['ประกาศใช้', act.length], ['ที่ฉันยังไม่รับทราบ', mine, mine ? 1 : 0]]; },
        sort: (a, b) => (b.effective || '').localeCompare(a.effective || '')
    },
    roles: {
        group: 1, label: 'โครงสร้างองค์กร', icon: 'bi-diagram-3', col: 'ims_roles', prefix: 'ro', tree: true, order: true,
        sub: 'ตำแหน่ง ผู้ดำรงตำแหน่ง สายบังคับบัญชา และบทบาทด้านระบบบริหาร', noun: 'ตำแหน่ง',
        fields: [
            { k: 'position', label: 'ตำแหน่ง *', req: 1 }, { k: 'holder', label: 'ผู้ดำรงตำแหน่ง' },
            { k: 'parent', label: 'รายงานต่อ', type: 'select', options: () => [['', '— ผู้บริหารสูงสุด —'], ...(items.roles || []).filter(r => !editing || r.id !== editing.id).map(r => [r.id, r.position])] },
            { k: 'isoRole', label: 'บทบาทในระบบบริหาร', type: 'select', options: [['', '—'], ['top', 'ผู้บริหารสูงสุด'], ['mr', 'ผู้แทนฝ่ายบริหาร (MR)'], ['auditor', 'ผู้ตรวจสอบภายใน'], ['owner', 'เจ้าของกระบวนการ'], ['security', 'ผู้ดูแลความมั่นคงสารสนเทศ'], ['dpo', 'เจ้าหน้าที่คุ้มครองข้อมูล (DPO)'], ['innov', 'ผู้นำด้านนวัตกรรม']] },
            { k: 'duties', label: 'หน้าที่ความรับผิดชอบ', type: 'textarea', full: true }, { k: 'authority', label: 'อำนาจตัดสินใจ', type: 'textarea', full: true },
            { k: 'orderNo', label: 'เลขที่คำสั่งแต่งตั้ง', ph: 'เช่น คำสั่งที่ 1/2569' }, { k: 'orderDate', label: 'ลงวันที่', type: 'date' }
        ],
        title: (r) => r.position, meta: (r) => [r.holder, ISO[r.isoRole] || '', r.orderNo ? 'คำสั่ง ' + r.orderNo : ''],
        badge: (r) => r.orderNo ? ['paid', 'มีคำสั่งแต่งตั้ง'] : r.isoRole ? ['pending', 'ยังไม่มีคำสั่ง'] : null,
        stats: (a) => [['ตำแหน่ง', a.length], ['บทบาทด้านระบบ', a.filter(r => r.isoRole).length], ['รอคำสั่งแต่งตั้ง', a.filter(r => r.isoRole && !r.orderNo).length, 1]]
    },
    raci: {
        group: 1, label: 'RACI', icon: 'bi-grid-3x3-gap', col: 'ims_raci', prefix: 'ra',
        sub: 'แต่ละกิจกรรม: R ผู้ปฏิบัติ · A ผู้รับผิดชอบสูงสุด · C ผู้ให้คำปรึกษา · I ผู้รับแจ้ง', noun: 'กิจกรรม',
        fields: [
            { k: 'activity', label: 'กิจกรรม / กระบวนการ *', req: 1, full: true },
            { k: 'r', label: 'R — ผู้ปฏิบัติ' }, { k: 'a', label: 'A — ผู้รับผิดชอบสูงสุด (คนเดียว)' }, { k: 'c', label: 'C — ผู้ให้คำปรึกษา' }, { k: 'i', label: 'I — ผู้รับแจ้ง' }, std
        ],
        title: (r) => r.activity, meta: (r) => [r.r && 'R: ' + r.r, r.a && 'A: ' + r.a, r.c && 'C: ' + r.c, r.i && 'I: ' + r.i],
        badge: (r) => r.a ? null : ['pending', 'ยังไม่ระบุ A'],
        stats: (a) => [['กิจกรรม', a.length], ['ยังไม่ระบุ A', a.filter(r => !r.a).length, 1]]
    },
    training: {
        group: 1, label: 'สมรรถนะ / อบรม', icon: 'bi-mortarboard', col: 'ims_training', prefix: 'tr',
        sub: 'บันทึกการอบรมและความสามารถของแต่ละคน เป็นหลักฐานว่าคนทำงานมีสมรรถนะเพียงพอ', noun: 'บันทึกอบรม',
        fields: [
            { k: 'person', label: 'ชื่อผู้เข้าอบรม *', req: 1 }, { k: 'course', label: 'หลักสูตร / หัวข้อ *', req: 1 },
            { k: 'date', label: 'วันที่อบรม', type: 'date' }, { k: 'expires', label: 'หมดอายุ / ต้องทบทวนวันที่', type: 'date' },
            { k: 'provider', label: 'ผู้จัด / วิทยากร' }, { k: 'result', label: 'ผลการประเมิน', type: 'select', options: [['', '—'], ['pass', 'ผ่าน'], ['fail', 'ไม่ผ่าน'], ['attend', 'เข้าร่วม']] },
            { k: 'link', label: 'ลิงก์หลักฐาน (ใบประกาศ)', full: true }, std
        ],
        title: (r) => `${r.person} · ${r.course}`, meta: (r) => [r.date ? thDate(r.date) : '', r.provider, r.expires ? 'ทบทวน ' + thDate(r.expires) : ''],
        badge: (r) => r.expires && r.expires < today() ? ['rejected', 'หมดอายุ'] : r.result === 'pass' ? ['paid', 'ผ่าน'] : r.result === 'fail' ? ['rejected', 'ไม่ผ่าน'] : null,
        stats: (a) => [['รายการ', a.length], ['คนที่ได้อบรม', new Set(a.map(r => r.person)).size], ['หมดอายุ', a.filter(r => r.expires && r.expires < today()).length, 1]],
        sort: (a, b) => (b.date || '').localeCompare(a.date || '')
    },
    stakeholders: {
        group: 1, label: 'ผู้มีส่วนได้เสีย', icon: 'bi-people', col: 'ims_stakeholders', prefix: 'sh',
        sub: 'ใครเกี่ยวข้องกับบริษัท ต้องการอะไร และเรามีข้อผูกพันอะไรกับเขา', noun: 'ผู้มีส่วนได้เสีย',
        fields: [
            { k: 'name', label: 'กลุ่ม / ชื่อ *', req: 1 }, { k: 'kind', label: 'ประเภท', type: 'select', options: [['customer', 'ลูกค้า'], ['staff', 'พนักงาน'], ['supplier', 'ผู้ให้บริการ / ซัพพลายเออร์'], ['regulator', 'หน่วยงานกำกับ'], ['owner', 'ผู้ถือหุ้น / เจ้าของ'], ['community', 'ชุมชน / สังคม'], ['other', 'อื่นๆ']] },
            { k: 'needs', label: 'ความต้องการ / ความคาดหวัง', type: 'textarea', full: true }, { k: 'duty', label: 'ข้อผูกพันที่เราต้องทำตาม (กฎหมาย สัญญา)', type: 'textarea', full: true },
            { k: 'influence', label: 'อิทธิพลต่อบริษัท', type: 'select', options: [['low', 'ต่ำ'], ['mid', 'กลาง'], ['high', 'สูง']], def: 'mid' }, { k: 'owner', label: WHO }, std
        ],
        title: (r) => r.name, meta: (r) => [SK[r.kind] || '', r.owner, r.needs ? r.needs.slice(0, 70) + (r.needs.length > 70 ? '…' : '') : ''],
        badge: (r) => r.influence === 'high' ? ['rejected', 'อิทธิพลสูง'] : null,
        stats: (a) => [['กลุ่ม', a.length], ['อิทธิพลสูง', a.filter(r => r.influence === 'high').length]]
    },
    comms: {
        group: 1, label: 'แผนสื่อสาร', icon: 'bi-chat-square-text', col: 'ims_comms', prefix: 'cm',
        sub: 'จะสื่อสารเรื่องอะไร กับใคร เมื่อไหร่ ช่องทางไหน และใครรับผิดชอบ', noun: 'แผนสื่อสาร',
        fields: [
            { k: 'topic', label: 'เรื่องที่สื่อสาร *', req: 1, full: true }, { k: 'audience', label: 'ถึงใคร' }, { k: 'channel', label: 'ช่องทาง', ph: 'เช่น LINE กลุ่ม, ประชุมเช้า, อีเมล' },
            { k: 'when', label: 'ความถี่ / เมื่อไหร่', ph: 'เช่น ทุกจันทร์, รายไตรมาส' }, { k: 'owner', label: WHO }, std
        ],
        title: (r) => r.topic, meta: (r) => [r.audience && 'ถึง ' + r.audience, r.channel, r.when, r.owner], badge: () => null,
        stats: (a) => [['แผน', a.length]]
    },
    risks: {
        group: 2, label: 'ความเสี่ยง / โอกาส', icon: 'bi-shield-exclamation', col: 'ims_risks', prefix: 'rk', sorted: 1,
        sub: 'ทะเบียนความเสี่ยงและโอกาสรวมของทุกมาตรฐาน ให้คะแนนโอกาสเกิด × ผลกระทบ', noun: 'รายการ',
        fields: [
            { k: 'title', label: 'ความเสี่ยง / โอกาส *', req: 1, full: true }, { k: 'rtype', label: 'ชนิด', type: 'select', options: [['risk', 'ความเสี่ยง'], ['opp', 'โอกาส']], def: 'risk' },
            { k: 'category', label: 'หมวด', type: 'select', options: [['quality', 'คุณภาพงาน'], ['security', 'ความมั่นคงสารสนเทศ / PDPA'], ['env', 'สิ่งแวดล้อม'], ['innov', 'นวัตกรรม'], ['finance', 'การเงิน / ธุรกิจ'], ['people', 'บุคลากร'], ['legal', 'กฎหมาย']] },
            { k: 'likelihood', label: 'โอกาสเกิด (1–5)', type: 'select', options: lv(), def: '3' }, { k: 'impact', label: 'ผลกระทบ (1–5)', type: 'select', options: lv(), def: '3' },
            { k: 'treatment', label: 'มาตรการจัดการ', type: 'textarea', full: true }, { k: 'owner', label: WHO }, { k: 'due', label: 'กำหนดเสร็จ', type: 'date' },
            { k: 'status', label: 'สถานะ', type: 'select', options: [['open', 'เปิดอยู่'], ['treating', 'กำลังจัดการ'], ['closed', 'ปิดแล้ว']], def: 'open' }, std
        ],
        title: (r) => r.title, meta: (r) => [r.rtype === 'opp' ? 'โอกาส' : 'ความเสี่ยง', CAT[r.category] || '', `คะแนน ${score(r)}`, r.owner],
        badge: (r) => r.status === 'closed' ? ['paid', 'ปิดแล้ว'] : r.rtype === 'opp' ? ['paid', 'โอกาส'] : score(r) >= 15 ? ['rejected', 'สูง'] : score(r) >= 8 ? ['pending', 'กลาง'] : ['paid', 'ต่ำ'],
        stats: (a) => { const open = a.filter(r => r.status !== 'closed' && r.rtype !== 'opp'); return [['ความเสี่ยงที่เปิดอยู่', open.length], ['ระดับสูง', open.filter(r => score(r) >= 15).length, 1], ['โอกาส', a.filter(r => r.rtype === 'opp').length]]; },
        lead: (r) => r.rtype === 'opp' ? ['ok', '<i class="bi bi-lightbulb"></i>'] : [score(r) >= 15 ? 'hi' : score(r) >= 8 ? 'mid' : 'ok', `<b>${score(r)}</b>`],
        sort: (a, b) => (a.status === 'closed') - (b.status === 'closed') || (a.rtype === 'opp') - (b.rtype === 'opp') || score(b) - score(a),
        before: (d) => { d.score = score(d); }
    },
    objectives: {
        group: 2, label: 'วัตถุประสงค์ / KPI', icon: 'bi-bullseye', col: 'ims_objectives', prefix: 'ob',
        sub: 'เป้าหมายที่วัดได้ พร้อมแผนปฏิบัติการ ผู้รับผิดชอบ และกำหนดเวลา', noun: 'วัตถุประสงค์',
        fields: [
            { k: 'title', label: 'วัตถุประสงค์ *', req: 1, full: true }, { k: 'target', label: 'เป้าหมาย (ตัวเลข)', type: 'number' }, { k: 'current', label: 'ผลปัจจุบัน', type: 'number' },
            { k: 'unit', label: 'หน่วย', ph: 'เช่น %, โครงการ, ครั้ง' }, { k: 'due', label: 'กำหนดเวลา', type: 'date' },
            { k: 'owner', label: WHO }, { k: 'status', label: 'สถานะ', type: 'select', options: [['active', 'กำลังดำเนินการ'], ['done', 'บรรลุแล้ว'], ['missed', 'ไม่บรรลุ']], def: 'active' },
            { k: 'plan', label: 'แผนปฏิบัติการ (ทำอะไร ใช้ทรัพยากรอะไร วัดผลอย่างไร)', type: 'textarea', full: true }, std
        ],
        title: (r) => r.title, meta: (r) => [r.target !== '' && r.target != null ? `${r.current ?? 0}/${r.target} ${r.unit || ''}` : '', r.due ? 'ภายใน ' + thDate(r.due) : '', r.owner],
        badge: (r) => r.status === 'done' ? ['paid', 'บรรลุ'] : r.status === 'missed' ? ['rejected', 'ไม่บรรลุ'] : r.due && r.due < today() ? ['rejected', 'เลยกำหนด'] : ['pending', pct(r) + '%'],
        stats: (a) => [['ทั้งหมด', a.length], ['กำลังดำเนินการ', a.filter(r => r.status === 'active').length], ['บรรลุแล้ว', a.filter(r => r.status === 'done').length], ['เลยกำหนด', a.filter(r => r.status === 'active' && r.due && r.due < today()).length, 1]],
        lead: (r) => [r.status === 'done' ? 'ok' : '', `<b>${pct(r)}%</b>`],
        sort: (a, b) => (a.due || '9').localeCompare(b.due || '9'), bar: pct,
        before: (d) => { d.target = d.target === '' ? '' : Number(d.target); d.current = d.current === '' ? '' : Number(d.current); }
    },
    changes: {
        group: 2, label: 'ควบคุมการเปลี่ยนแปลง', icon: 'bi-arrow-repeat', col: 'ims_changes', prefix: 'ch',
        sub: 'บันทึกการเปลี่ยนแปลงที่กระทบระบบหรือบริการ ประเมินผลกระทบก่อนทำ และอนุมัติ', noun: 'การเปลี่ยนแปลง',
        fields: [
            { k: 'title', label: 'เรื่องที่จะเปลี่ยน *', req: 1, full: true }, { k: 'reason', label: 'เหตุผล', type: 'textarea', full: true },
            { k: 'impact', label: 'ผลกระทบที่คาดไว้ (คุณภาพ / ความปลอดภัย / สิ่งแวดล้อม / ลูกค้า)', type: 'textarea', full: true },
            { k: 'owner', label: WHO }, { k: 'plannedDate', label: 'วันที่วางแผนทำ', type: 'date' },
            { k: 'status', label: 'สถานะ', type: 'select', options: [['proposed', 'เสนอ'], ['approved', 'อนุมัติ'], ['done', 'ทำแล้ว'], ['rejected', 'ไม่อนุมัติ']], def: 'proposed' },
            { k: 'approvedBy', label: 'ผู้อนุมัติ' }, { k: 'verify', label: 'ตรวจสอบผลหลังเปลี่ยน', type: 'textarea', full: true }, std
        ],
        title: (r) => r.title, meta: (r) => [r.plannedDate ? thDate(r.plannedDate) : '', r.owner, r.approvedBy && 'อนุมัติ: ' + r.approvedBy],
        badge: (r) => r.status === 'done' ? ['paid', 'ทำแล้ว'] : r.status === 'approved' ? ['quote', 'อนุมัติ'] : r.status === 'rejected' ? ['rejected', 'ไม่อนุมัติ'] : ['pending', 'รอพิจารณา'],
        stats: (a) => [['ทั้งหมด', a.length], ['รอพิจารณา', a.filter(r => r.status === 'proposed').length, 1], ['ทำแล้ว', a.filter(r => r.status === 'done').length]],
        sort: (a, b) => (b.plannedDate || '').localeCompare(a.plannedDate || '')
    }
};
const DT = { policy: 'นโยบาย', procedure: 'ขั้นตอน', wi: 'วิธีปฏิบัติงาน', form: 'แบบฟอร์ม', record: 'บันทึก' };
const ISO = { top: 'ผู้บริหารสูงสุด', mr: 'MR', auditor: 'ผู้ตรวจสอบภายใน', owner: 'เจ้าของกระบวนการ', security: 'ดูแลความมั่นคง', dpo: 'DPO', innov: 'ผู้นำนวัตกรรม' };
const SK = { customer: 'ลูกค้า', staff: 'พนักงาน', supplier: 'ผู้ให้บริการ', regulator: 'หน่วยงานกำกับ', owner: 'ผู้ถือหุ้น', community: 'ชุมชน', other: 'อื่นๆ' };
const CAT = { quality: 'คุณภาพ', security: 'ความมั่นคง/PDPA', env: 'สิ่งแวดล้อม', innov: 'นวัตกรรม', finance: 'การเงิน', people: 'บุคลากร', legal: 'กฎหมาย' };
function score(r) { return (Number(r.likelihood) || 0) * (Number(r.impact) || 0); }
function pct(r) { const t = Number(r.target); return t > 0 ? Math.max(0, Math.min(100, Math.round((Number(r.current) || 0) / t * 100))) : 0; }
function ackedBy(p, uid) { return acks.some(a => a.policyId === p.id && a.uid === uid && a.version === (p.version || '1.0')); }

(async function init() {
    me = await requireUser();
    const q = new URLSearchParams(location.search).get('type');
    if (q && TABS[q]) tab = q;
    $('tabs').innerHTML = [1, 2].map(g => (g === 2 ? '<span class="ims-sep"></span>' : '') + Object.entries(TABS).filter(([, t]) => t.group === g)
        .map(([k, t]) => `<button type="button" class="tab" data-k="${k}"><i class="bi ${t.icon}"></i> ${t.label}</button>`).join('')).join('');
    $('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) show(b.dataset.k); });
    $('btn-add').addEventListener('click', () => openRec(null));
    $('list').addEventListener('click', onList);
    $('rec-cancel').addEventListener('click', () => closeModal('rec-modal'));
    $('rec-ok').addEventListener('click', save);
    $('rec-del').addEventListener('click', remove);
    $('btn-order').addEventListener('click', (e) => { e.preventDefault(); try { window.parent.location.hash = '#letter'; } catch (x) { location.href = 'letter.html'; } });
    await show(tab);
})();

async function show(k) {
    tab = k; const T = TABS[k];
    document.querySelectorAll('#tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.k === k));
    $('ims-title').textContent = T.label; $('ims-sub').textContent = T.sub;
    $('btn-add').hidden = !me.isAdmin; $('btn-order').hidden = !(me.isAdmin && k === 'roles');
    $('btn-add').innerHTML = `<i class="bi bi-plus-lg"></i> เพิ่ม${T.noun}`;
    $('list').innerHTML = '<div class="tm-empty">กำลังโหลด…</div>';
    try {
        items[k] = (await getDocs(collection(db, T.col))).docs.map(d => ({ ...d.data(), id: d.id }));
        if (T.ack) await loadAcks();
        if (k === 'roles') { /* parent names resolve from this list */ }
    } catch (e) { console.error(e); $('list').innerHTML = '<div class="tm-empty">โหลดไม่สำเร็จ — ตรวจสอบสิทธิ์หรือการเชื่อมต่อ</div>'; return; }
    render();
}

async function loadAcks() {
    const base = collection(db, 'ims_acks');
    acks = (await getDocs(me.isAdmin ? base : query(base, where('uid', '==', me.uid)))).docs.map(d => d.data());
    if (me.isAdmin && !users.length) { try { users = (await getDocs(collection(db, 'users'))).docs.map(d => d.data()); } catch (e) { users = []; } }
}

function render() {
    const T = TABS[tab]; let a = (items[tab] || []).slice();
    if (T.sort) a.sort(T.sort);
    $('stats').innerHTML = T.stats(a).map(([l, v, warn]) => `<div class="tm-stat${warn && v ? ' warn' : ''}"><b>${v}</b><span>${esc(l)}</span></div>`).join('');
    if (!a.length) {
        $('list').innerHTML = `<div class="ims-empty"><i class="bi ${T.icon}"></i><b>ยังไม่มี${esc(T.noun)}</b>`
            + (me.isAdmin && tab !== 'training' ? `<p>เริ่มจากรายการตั้งต้นที่ร่างไว้ให้จากข้อมูลของบริษัท แล้วแก้ไขให้ตรงความจริง หรือกด "เพิ่ม" เพื่อสร้างเอง</p><button type="button" class="btn btn-primary" id="btn-seed">เติมรายการตั้งต้น</button>` : me.isAdmin ? '<p>กด "เพิ่ม" เพื่อบันทึกการอบรมของแต่ละคน (ข้อมูลนี้ต้องมาจากของจริง จึงไม่เติมให้)</p>' : '<p>ผู้ดูแลยังไม่ได้เพิ่มข้อมูลในส่วนนี้</p>') + '</div>';
        const sb = $('btn-seed'); if (sb) sb.addEventListener('click', seed);
        return;
    }
    $('list').innerHTML = T.tree ? tree(a, T) : a.map((r, i) => row(r, T, 0, i)).join('');
}

function row(r, T, depth = 0, idx = 0) {
    const b = T.badge(r); const meta = T.meta(r).filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('');
    const chips = (r.standards || []).map(s => `<i class="ims-std">${esc(s)}</i>`).join('');
    const ackBtn = T.ack && r.status === 'active' && !ackedBy(r, me.uid) ? `<button type="button" class="btn btn-primary tm-btn-sm" data-ack="${esc(r.id)}">รับทราบ</button>` : '';
    const link = r.link ? `<a class="ims-link" href="${esc(/^https?:/.test(r.link) ? r.link : '#')}" target="_blank" rel="noopener" data-nolink><i class="bi bi-box-arrow-up-right"></i></a>` : '';
    const ld = T.lead ? T.lead(r) : ['', `<i class="bi ${T.icon}"></i>`];
    return `<div class="ims-row" data-id="${esc(r.id)}" style="--d:${depth};--i:${Math.min(idx, 12)}" tabindex="0" role="button">
        <div class="ims-lead ${ld[0]}">${ld[1]}</div>
        <div class="ims-main"><div class="ims-t">${esc(T.title(r))}</div><div class="ims-m">${meta}${chips}</div>${T.bar ? `<div class="ims-bar"><i style="width:${T.bar(r)}%"></i></div>` : ''}</div>
        ${link}${ackBtn}${b ? `<span class="badge badge-${b[0]}">${esc(b[1])}</span>` : ''}<i class="bi bi-chevron-right ims-go"></i></div>`;
}

function tree(a, T) {
    const byParent = {}; a.forEach(r => { (byParent[r.parent || ''] = byParent[r.parent || ''] || []).push(r); });
    const ids = new Set(a.map(r => r.id)); const roots = a.filter(r => !r.parent || !ids.has(r.parent));
    const out = []; const walk = (r, d) => { out.push(row(r, T, d, out.length)); (byParent[r.id] || []).forEach(c => walk(c, d + 1)); };
    roots.forEach(r => walk(r, 0)); return `<div class="ims-tree">${out.join('')}</div>`;
}

async function onList(e) {
    if (e.target.closest('[data-nolink]')) { e.stopPropagation(); return; }
    const ab = e.target.closest('[data-ack]');
    if (ab) { e.stopPropagation(); return acknowledge(ab.dataset.ack); }
    const r = e.target.closest('.ims-row'); if (!r) return;
    openRec((items[tab] || []).find(x => x.id === r.dataset.id));
}

async function acknowledge(id) {
    const p = (items.policies || []).find(x => x.id === id); if (!p) return;
    const v = p.version || '1.0';
    try {
        await setDoc(doc(db, 'ims_acks', `${id}_v${v}_${me.uid}`), { policyId: id, version: v, uid: me.uid, name: me.name, createdAt: serverTimestamp() });
        acks.push({ policyId: id, version: v, uid: me.uid, name: me.name }); toast('บันทึกการรับทราบแล้ว ขอบคุณครับ'); render();
    } catch (err) { console.error(err); toast('บันทึกไม่สำเร็จ: ' + err.message, false); }
}

function field(f, val) {
    const id = 'f-' + f.k, v = val ?? f.def ?? '', dis = me.isAdmin ? '' : ' disabled';
    let input;
    if (f.type === 'textarea') input = `<textarea id="${id}" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}"${dis}>${esc(v)}</textarea>`;
    else if (f.type === 'select') { const o = typeof f.options === 'function' ? f.options() : f.options; input = `<select id="${id}"${dis}>${o.map(([x, l]) => `<option value="${esc(x)}"${String(x) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }
    else if (f.type === 'tags') input = `<div class="ims-tags" id="${id}">${f.options.map(([x, l]) => `<label class="ims-tag"><input type="checkbox" value="${x}"${(val || []).includes(x) ? ' checked' : ''}${dis}><span>${esc(l)}</span></label>`).join('')}</div>`;
    else input = `<input id="${id}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.ph || '')}"${dis}>`;
    return `<div class="form-group${f.full ? ' full' : ''}"><label for="${id}">${esc(f.label)}</label>${input}</div>`;
}

function openRec(r) {
    const T = TABS[tab]; editing = r;
    if (!r && !me.isAdmin) return;
    $('rec-title').textContent = r ? T.title(r) : `เพิ่ม${T.noun}`;
    $('rec-sub').textContent = me.isAdmin ? '' : 'ดูได้อย่างเดียว — ผู้ดูแลเป็นผู้แก้ไขทะเบียน';
    $('rec-form').innerHTML = T.fields.map(f => field(f, r ? r[f.k] : undefined)).join('');
    $('rec-ok').hidden = !me.isAdmin; $('rec-del').hidden = !(me.isAdmin && r);
    const h = $('rec-hist'); const hist = r && r.history;
    h.hidden = !(T.history && hist && hist.length);
    if (!h.hidden) h.innerHTML = '<b>ประวัติการแก้ไข</b>' + hist.slice().reverse().map(x => `<div><span>v${esc(x.v)}</span> ${esc(x.date)} · ${esc(x.by)}${x.note ? ' — ' + esc(x.note) : ''}</div>`).join('');
    if (T.ack && r && me.isAdmin) ackSummary(r);
    openModal('rec-modal');
}

function ackSummary(p) {
    const v = p.version || '1.0'; const done = new Set(acks.filter(a => a.policyId === p.id && a.version === v).map(a => a.uid));
    const missing = users.filter(u => !done.has(u.uid)).map(u => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email);
    const h = $('rec-hist'); h.hidden = false;
    h.innerHTML = `<b>รับทราบ v${esc(v)} แล้ว ${done.size}/${users.length} คน</b>` + (missing.length ? `<div>ยังไม่รับทราบ: ${esc(missing.join(', '))}</div>` : '<div>ครบทุกคนแล้ว</div>');
}

async function save() {
    const T = TABS[tab]; const data = {};
    for (const f of T.fields) {
        const el = $('f-' + f.k);
        data[f.k] = f.type === 'tags' ? [...el.querySelectorAll('input:checked')].map(i => i.value) : el.value.trim();
        if (f.req && !data[f.k]) { toast(`กรุณากรอก ${f.label.replace(' *', '')}`, false); return; }
    }
    if (T.before) T.before(data);
    const old = editing;
    if (T.history) {
        const hist = (old && old.history) || [];
        if (!old || (old.version || '') !== data.version || (old.status || '') !== data.status) hist.push({ v: data.version || '1.0', date: thDate(today()), by: me.name, note: data.changeNote || '' });
        data.history = hist;
    }
    try {
        if (old) await updateDoc(doc(db, T.col, old.id), data);
        else await setDoc(doc(db, T.col, `${T.prefix}_${Date.now()}`), { ...data, createdBy: me.uid, createdAt: serverTimestamp() });
        closeModal('rec-modal'); toast('บันทึกแล้ว'); show(tab);
    } catch (err) { console.error(err); toast('บันทึกไม่สำเร็จ: ' + err.message, false); }
}

async function remove() {
    const T = TABS[tab]; if (!editing || !confirm(`ลบ "${T.title(editing)}" ออกจากทะเบียน?\nลบแล้วกู้คืนไม่ได้`)) return;
    try { await deleteDoc(doc(db, T.col, editing.id)); closeModal('rec-modal'); toast('ลบแล้ว'); show(tab); } catch (err) { toast('ลบไม่สำเร็จ: ' + err.message, false); }
}

// Fill an empty register with the starter content (fixed ids, so pressing it twice cannot duplicate).
async function seed() {
    const T = TABS[tab]; const btn = $('btn-seed'); if (btn) { btn.disabled = true; btn.textContent = 'กำลังเติม…'; }
    try {
        const data = (await import('./ims-seed.js')).default[tab] || [];
        for (let i = 0; i < data.length; i++) {
            const d = { ...data[i] }; if (T.before) T.before(d);
            await setDoc(doc(db, T.col, `${T.prefix}_seed_${i}`), { ...d, createdBy: me.uid, createdAt: serverTimestamp(), seeded: true });
        }
        toast(`เติม ${data.length} รายการแล้ว — ตรวจและแก้ไขให้ตรงความจริง`); show(tab);
    } catch (err) { console.error(err); toast('เติมไม่สำเร็จ: ' + err.message, false); show(tab); }
}
