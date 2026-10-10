import type {
  BusinessAction,
  BusinessModuleKey,
  BusinessRecord,
  BusinessSection,
} from '@/domain/operations'
import type { OperationsRepository } from '../contracts'
import { RepositoryError } from '../contracts'

const delay = async () => new Promise((resolve) => window.setTimeout(resolve, 120))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

interface FixtureConfig {
  prefix: string
  titles: [string, string]
  statuses: [string, string]
  secondary: [string, string]
  summaryA: [string, string]
  summaryB: [string, string]
  summaryC: [string, string]
  risks?: ['normal' | 'attention' | 'high', 'normal' | 'attention' | 'high']
}

const configs: Record<BusinessModuleKey, FixtureConfig> = {
  users: {
    prefix: 'UID',
    titles: ['星野收藏家', 'PikaFan'],
    statuses: ['active', 'restricted'],
    secondary: ['st***@mail.com · 138 **** 2048', 'pi***@mail.com · 186 **** 7315'],
    summaryA: ['余额 18,640 Coin', '余额 2,080 Coin'],
    summaryB: ['卡牌 26 张', '卡牌 4 张'],
    summaryC: ['最近登录 09/18 14:20', '最近登录 09/17 22:11'],
    risks: ['normal', 'attention'],
  },
  riskEvents: {
    prefix: 'RSK',
    titles: ['充值设备指纹异常', '短时高频抽卡'],
    statuses: ['open', 'reviewing'],
    secondary: ['UID-100028', 'UID-100031'],
    summaryA: ['设备关联 4 个账号', '10 分钟 48 次请求'],
    summaryB: ['高风险', '需关注'],
    summaryC: ['规则 RF-204', '规则 DR-118'],
    risks: ['high', 'attention'],
  },
  coinLedger: {
    prefix: 'LED',
    titles: ['充值入账', '抽卡扣减'],
    statuses: ['succeeded', 'succeeded'],
    secondary: ['UID-100028 · RCG-260918-001', 'UID-100031 · DRW-260918-204'],
    summaryA: ['+5,000 Coin', '-5,000 Coin'],
    summaryB: ['13,640 → 18,640', '7,080 → 2,080'],
    summaryC: ['支付服务', '抽卡事务'],
    risks: ['normal', 'normal'],
  },
  recharges: {
    prefix: 'RCG',
    titles: ['Visa / Mastercard 充值', 'USDT 充值'],
    statuses: ['succeeded', 'manual_review'],
    secondary: ['UID-100028', 'UID-100031'],
    summaryA: ['$500.00', '$1,000.00'],
    summaryB: ['5,000 Coin', '10,000 Coin'],
    summaryC: ['Visa **** 2048', 'USDT · TRC20'],
    risks: ['normal', 'attention'],
  },
  rechargeTiers: {
    prefix: 'TIER',
    titles: ['$100 固定档位', '自定义金额'],
    statuses: ['active', 'active'],
    secondary: ['Visa / Mastercard · 支付宝 · USDT', '最低 $100，最高 $20,000'],
    summaryA: ['1,000 Coin', '按金额换算'],
    summaryB: ['首充奖励适用', '首充奖励适用'],
    summaryC: ['固定', '自定义'],
    risks: ['normal', 'normal'],
  },
  refunds: {
    prefix: 'RFD',
    titles: ['充值退款申请', '抽卡异常退款'],
    statuses: ['pending_review', 'succeeded'],
    secondary: ['RCG-260918-001 · UID-100028', 'DRW-260917-155 · UID-100041'],
    summaryA: ['$500.00', '500 Coin'],
    summaryB: ['待财务复核', '反向流水完成'],
    summaryC: ['用户申请', '事务补偿'],
    risks: ['attention', 'normal'],
  },
  chargebacks: {
    prefix: 'CBK',
    titles: ['Visa 拒付通知', '支付争议举证'],
    statuses: ['open', 'reviewing'],
    secondary: ['RCG-260916-088 · UID-100052', 'RCG-260915-064 · UID-100067'],
    summaryA: ['$1,000.00', '$500.00'],
    summaryB: ['响应剩余 4 天', '证据已上传'],
    summaryC: ['Visa', 'Mastercard'],
    risks: ['high', 'attention'],
  },
  adjustments: {
    prefix: 'ADJ',
    titles: ['Coin 调账申请', '退款冲正申请'],
    statuses: ['pending_review', 'rejected'],
    secondary: ['UID-100028 · 申请人 ADM-0003', 'UID-100041 · 申请人 ADM-0002'],
    summaryA: ['+500 Coin', '-1,000 Coin'],
    summaryB: ['证据 2 份', '证据 1 份'],
    summaryC: ['等待复核', '理由不足'],
    risks: ['attention', 'normal'],
  },
  drawOrders: {
    prefix: 'DRW',
    titles: ['宝可梦群星收藏 · 十连抽', '151 大师球精选 · 单抽'],
    statuses: ['succeeded', 'processing'],
    secondary: ['UID-100028 · BAT-260915-003', 'UID-100031 · BAT-260919-002'],
    summaryA: ['5,000 Coin', '500 Coin'],
    summaryB: ['10 张结果', '等待最终状态'],
    summaryC: ['事务成功', '超时待查询'],
    risks: ['normal', 'attention'],
  },
  anomalies: {
    prefix: 'ANO',
    titles: ['抽卡请求超时', '库存快照不一致'],
    statuses: ['processing', 'manual_review'],
    secondary: ['DRW-260918-002', 'DRW-260917-184'],
    summaryA: ['已查询 2 次', '已冻结补偿'],
    summaryB: ['最终状态未知', '事务已回滚'],
    summaryC: ['P1', 'P0'],
    risks: ['attention', 'high'],
  },
  recycles: {
    prefix: 'REC',
    titles: ['卡牌回收订单', '批量回收订单'],
    statuses: ['completed', 'processing'],
    secondary: ['UID-100028 · 3 张卡牌', 'UID-100031 · 8 张卡牌'],
    summaryA: ['6,800 Coin', '12,400 Coin'],
    summaryB: ['锁定值执行', '资产已锁定'],
    summaryC: ['不可撤销', '等待入账'],
    risks: ['normal', 'attention'],
  },
  shipments: {
    prefix: 'SHP',
    titles: ['标准包邮申请', '模板卡发货申请'],
    statuses: ['pending_review', 'pending_template_allocation'],
    secondary: ['UID-100028 · 4 张卡牌', 'UID-100031 · 2 张卡牌'],
    summaryA: ['锁定 Coin 3,800', '锁定 Coin 2,400'],
    summaryB: ['上海市 浦东新区 ***', '东京都 渋谷区 ***'],
    summaryC: ['待审核', '模板缺口 1'],
    risks: ['normal', 'attention'],
  },
  pickLists: {
    prefix: 'PICK',
    titles: ['上海仓拣货单', '东京仓拣货单'],
    statuses: ['picking', 'pending_pick'],
    secondary: ['SHP-001 · 4 张', 'SHP-002 · 2 张'],
    summaryA: ['已扫描 3 / 4', '已扫描 0 / 2'],
    summaryB: ['拣货员 WH-008', '未指派'],
    summaryC: ['A 区', 'B 区'],
    risks: ['attention', 'normal'],
  },
  returns: {
    prefix: 'RET',
    titles: ['物流退件待检', '地址错误退件'],
    statuses: ['return_inspection', 'returned'],
    secondary: ['SHP-260910-044', 'SHP-260908-019'],
    summaryA: ['实体卡 2 张', '实体卡 1 张'],
    summaryB: ['DHL', 'UPS'],
    summaryC: ['待验收', '等待用户确认'],
    risks: ['attention', 'attention'],
  },
  exceptions: {
    prefix: 'FUL',
    titles: ['实体卡扫码不一致', '模板候选库存缺口'],
    statuses: ['blocked', 'open'],
    secondary: ['SHP-260918-001', 'TPL-5000-S'],
    summaryA: ['禁止出库', '缺口 3 张'],
    summaryB: ['期望 PHY-000101', '未履约权益 12'],
    summaryC: ['P0', 'P1'],
    risks: ['high', 'high'],
  },
  banners: {
    prefix: 'BNR',
    titles: ['首页秋季收藏季', '151 大师球专题'],
    statuses: ['published', 'scheduled'],
    secondary: ['桌面图 + 移动图', '桌面图 + 移动图'],
    summaryA: ['排序 1', '排序 2'],
    summaryB: ['简体中文完成', '简体中文完成'],
    summaryC: ['启用', '待排期'],
    risks: ['normal', 'normal'],
  },
  homeSections: {
    prefix: 'HOME',
    titles: ['平台保障区块', '最新抽取动态'],
    statuses: ['published', 'draft'],
    secondary: ['首页第 4 区块', '首页第 2 区块'],
    summaryA: ['已启用', '未启用'],
    summaryB: ['版本 8', '版本 3'],
    summaryC: ['09/16 发布', '09/18 编辑'],
    risks: ['normal', 'normal'],
  },
  faq: {
    prefix: 'FAQ',
    titles: ['抽卡与概率说明', '回收和实物发货'],
    statuses: ['published', 'draft'],
    secondary: ['排序 1 · 8 个问答', '排序 2 · 6 个问答'],
    summaryA: ['简体中文完成', '简体中文完成'],
    summaryB: ['版本 12', '版本 5'],
    summaryC: ['已发布', '待发布'],
    risks: ['normal', 'normal'],
  },
  staticPages: {
    prefix: 'PAGE',
    titles: ['隐私政策', '配送说明'],
    statuses: ['published', 'pending_review'],
    secondary: ['/privacy', '/shipping'],
    summaryA: ['版本 6', '版本 4'],
    summaryB: ['必填内容完整', '必填内容完整'],
    summaryC: ['09/12 发布', '等待审核'],
    risks: ['normal', 'attention'],
  },
  localization: {
    prefix: 'REL',
    titles: ['首页内容发布包', '条款更新发布包'],
    statuses: ['published', 'pending_review'],
    secondary: ['包含 5 项内容', '包含 2 项内容'],
    summaryA: ['简体中文 100%', '简体中文 100%'],
    summaryB: ['版本 24', '版本 25'],
    summaryC: ['生产环境', '等待发布'],
    risks: ['normal', 'attention'],
  },
  contentRelease: {
    prefix: 'VER',
    titles: ['内容版本 24', '内容版本 23'],
    statuses: ['published', 'archived'],
    secondary: ['发布人 ADM-0002', '发布人 ADM-0001'],
    summaryA: ['5 项变更', '3 项变更'],
    summaryB: ['生产环境', '已回滚'],
    summaryC: ['09/17', '09/12'],
    risks: ['normal', 'normal'],
  },
  tickets: {
    prefix: 'TKT',
    titles: ['充值成功但 Coin 未到账', '发货地址需要修改'],
    statuses: ['processing', 'waiting_user'],
    secondary: ['UID-100028 · 支付问题', 'UID-100031 · 发货问题'],
    summaryA: ['优先级 P1', '优先级 P2'],
    summaryB: ['负责人 客服-小林', '负责人 客服-安娜'],
    summaryC: ['SLA 剩余 48 分钟', '等待用户 6 小时'],
    risks: ['attention', 'normal'],
  },
  notificationTemplates: {
    prefix: 'NTF',
    titles: ['充值成功站内通知', '发货出库邮件'],
    statuses: ['active', 'active'],
    secondary: ['站内通知 · 安全通知', '邮件 · 发货通知'],
    summaryA: ['简体中文完成', '简体中文完成'],
    summaryB: ['不可关闭', '不可关闭'],
    summaryC: ['版本 7', '版本 11'],
    risks: ['normal', 'normal'],
  },
  deliveryRecords: {
    prefix: 'MSG',
    titles: ['充值成功通知', '物流状态更新'],
    statuses: ['succeeded', 'failed'],
    secondary: ['UID-100028 · 站内通知', 'UID-100031 · 邮件'],
    summaryA: ['模板 NTF-001', '模板 NTF-002'],
    summaryB: ['已送达', '重试 2 次'],
    summaryC: ['09/18 14:22', '09/18 13:08'],
    risks: ['normal', 'attention'],
  },
  loginRecords: {
    prefix: 'LOG',
    titles: ['管理员登录成功', '异常地点登录失败'],
    statuses: ['succeeded', 'denied'],
    secondary: ['ADM-0001 · 上海', 'ADM-0003 · 异常地区'],
    summaryA: ['Windows 11 · Chrome', 'macOS · Safari'],
    summaryB: ['116.***.24.18', '45.***.82.10'],
    summaryC: ['双重验证通过', '已触发锁定'],
    risks: ['normal', 'high'],
  },
  systemSettings: {
    prefix: 'SET',
    titles: ['安全策略', '业务阈值'],
    statuses: ['active', 'active'],
    secondary: ['会话与双重验证', '发货与库存预警'],
    summaryA: ['会话 8 小时', '包邮门槛 2,000 Coin'],
    summaryB: ['强制 2FA', '库存预警 5 张'],
    summaryC: ['系统级', '业务级'],
    risks: ['normal', 'normal'],
  },
}

const actionsFor = (
  module: BusinessModuleKey,
  index: number,
  currentStatus = configs[module].statuses[index],
): BusinessAction[] => {
  if (
    ['coinLedger', 'rechargeTiers', 'recycles', 'deliveryRecords', 'loginRecords'].includes(module)
  )
    return []
  if (module === 'users') {
    const restore = currentStatus === 'restricted'
    return [
      {
        key: restore ? 'restore_draw' : 'freeze_draw',
        label: restore ? '恢复抽卡' : '冻结抽卡',
        targetStatus: restore ? 'active' : 'restricted',
        tone: 'danger',
        confirmationWord: restore ? 'RESTORE' : 'FREEZE',
        consequence: '仅改变抽卡权限，不会修改余额、资产或开奖结果。',
      },
      {
        key: 'freeze_shipping',
        label: '冻结发货',
        targetStatus: 'restricted',
        tone: 'danger',
        confirmationWord: 'FREEZE',
        consequence: '未出库的发货申请将暂停，已经出库的物流不受影响。',
      },
    ]
  }
  if (module === 'recharges' || module === 'drawOrders' || module === 'anomalies')
    return [
      {
        key: 'query_final',
        label: '查询最终状态',
        targetStatus: 'succeeded',
        tone: 'warning',
        confirmationWord: 'QUERY',
        consequence: '仅查询可信服务端最终状态，不会重抽或改奖。',
      },
    ]
  if (module === 'adjustments')
    return [
      {
        key: 'approve',
        label: '复核通过',
        targetStatus: 'approved',
        tone: 'danger',
        confirmationWord: 'APPROVE',
        consequence: '通过后仅生成反向或调整流水，不允许删除既有账本。',
      },
    ]
  if (module === 'shipments') {
    const transitions: Record<string, BusinessAction> = {
      pending_review: {
        key: 'approve',
        label: '审核通过',
        targetStatus: 'pending_template_allocation',
        tone: 'primary',
        confirmationWord: 'APPROVE',
        consequence: '卡牌保持锁定，并进入模板实体分配环节。',
      },
      pending_template_allocation: {
        key: 'allocate',
        label: '确认实体分配',
        targetStatus: 'pending_pick',
        tone: 'primary',
        confirmationWord: 'ALLOCATE',
        consequence: '分配后实体卡与订单绑定，禁止降级替换。',
      },
      pending_pick: {
        key: 'start_pick',
        label: '开始拣货',
        targetStatus: 'picking',
        tone: 'primary',
        confirmationWord: 'PICK',
        consequence: '拣货必须逐张扫码核对实体编号。',
      },
      picking: {
        key: 'pack',
        label: '确认打包',
        targetStatus: 'packed',
        tone: 'primary',
        confirmationWord: 'PACK',
        consequence: '仅当所有实体卡扫码一致时才可打包。',
      },
      packed: {
        key: 'ship',
        label: '确认出库',
        targetStatus: 'shipped',
        tone: 'danger',
        confirmationWord: 'SHIP',
        consequence: '出库会改变实体卡状态，且必须已填写承运商和追踪号。',
      },
      shipped: {
        key: 'in_transit',
        label: '更新为运输中',
        targetStatus: 'in_transit',
        tone: 'primary',
        confirmationWord: 'TRANSIT',
        consequence: '物流状态将同步到用户端。',
      },
      in_transit: {
        key: 'deliver',
        label: '确认签收',
        targetStatus: 'delivered',
        tone: 'primary',
        confirmationWord: 'DELIVER',
        consequence: '确认后用户端状态更新为已签收。',
      },
    }
    return transitions[currentStatus] ? [transitions[currentStatus]] : []
  }
  if (module === 'tickets') {
    if (currentStatus === 'resolved')
      return [
        {
          key: 'close',
          label: '关闭工单',
          targetStatus: 'closed',
          tone: 'warning',
          confirmationWord: 'CLOSE',
          consequence: '关闭后仍保留全部消息、内部备注和审计记录。',
        },
      ]
    return [
      {
        key: 'wait_user',
        label: '等待用户',
        targetStatus: 'waiting_user',
        tone: 'neutral',
        confirmationWord: 'WAIT',
        consequence: '工单 SLA 将按等待用户规则计算。',
      },
      {
        key: 'resolve',
        label: '标记已解决',
        targetStatus: 'resolved',
        tone: 'primary',
        confirmationWord: 'RESOLVE',
        consequence: '将记录用户可见的处理结果，操作不可从时间线删除。',
      },
    ]
  }
  if (['banners', 'homeSections', 'faq', 'staticPages', 'localization'].includes(module)) {
    return currentStatus === 'published'
      ? [
          {
            key: 'rollback',
            label: '回滚到上一版本',
            targetStatus: 'draft',
            tone: 'danger',
            confirmationWord: 'ROLLBACK',
            consequence: '当前版本会停止展示，历史版本和操作记录仍保留。',
          },
        ]
      : [
          {
            key: 'publish',
            label: '发布内容',
            targetStatus: 'published',
            tone: 'warning',
            confirmationWord: 'PUBLISH',
            consequence: '内容将进入当前生产发布版本，并保留可回滚历史。',
          },
        ]
  }
  if (module === 'notificationTemplates')
    return [
      {
        key: 'preview',
        label: '生成预览',
        targetStatus: 'active',
        tone: 'neutral',
        confirmationWord: 'PREVIEW',
        consequence: '仅生成预览，不会向用户发送消息。',
      },
    ]
  if (module === 'systemSettings')
    return [
      {
        key: 'save_policy',
        label: '保存策略',
        targetStatus: 'active',
        tone: 'danger',
        confirmationWord: 'SAVE',
        consequence: '新策略将影响后续后台会话或业务校验。',
      },
    ]
  return [
    {
      key: 'review',
      label: '提交人工复核',
      targetStatus: 'reviewing',
      tone: 'warning',
      confirmationWord: 'REVIEW',
      consequence: '记录将进入人工复核队列并生成不可删除的操作时间线。',
    },
  ]
}

const genericSections = (
  module: BusinessModuleKey,
  config: FixtureConfig,
  index: number,
): BusinessSection[] => [
  {
    key: 'overview',
    title: '基础信息',
    fields: [
      {
        label: '业务编号',
        value: `${config.prefix}-${String(index + 1).padStart(6, '0')}`,
        copyable: true,
      },
      { label: '业务类型', value: module },
      { label: '状态', value: config.statuses[index] },
      { label: '关联对象', value: config.secondary[index] },
    ],
  },
  {
    key: 'business',
    title: '业务数据',
    fields: [
      { label: '业务数据一', value: config.summaryA[index] },
      { label: '业务数据二', value: config.summaryB[index] },
      { label: '业务数据三', value: config.summaryC[index] },
      { label: '敏感信息', value: index ? '18***7315' : '13***2048', sensitive: true },
    ],
  },
  {
    key: 'trace',
    title: '请求与审计',
    fields: [
      { label: 'Request ID', value: `req_${module}_${index + 1}`, copyable: true },
      { label: '幂等键', value: `idem_${module}_${index + 1}`, copyable: true },
      {
        label: '状态更新时间',
        value: index ? '2026-09-18T13:08:00+08:00' : '2026-09-18T14:22:00+08:00',
      },
      { label: '数据来源', value: '服务端可信状态' },
    ],
  },
]

const userSections = (config: FixtureConfig, index: number): BusinessSection[] => [
  ...genericSections('users', config, index),
  {
    key: 'coin',
    title: 'Coin',
    fields: [
      { label: '余额', value: index ? '2,080 Coin' : '18,640 Coin' },
      { label: '最近流水', value: index ? '-500 Coin · 单抽' : '+5,000 Coin · 充值' },
    ],
  },
  {
    key: 'recharge',
    title: '充值',
    fields: [
      { label: '累计充值', value: index ? '$100.00' : '$2,600.00' },
      { label: '首充资格', value: index ? '已使用' : '已使用' },
    ],
  },
  {
    key: 'draw',
    title: '抽卡',
    fields: [
      { label: '累计抽数', value: index ? '4' : '86' },
      { label: '最近订单', value: index ? 'DRW-260918-205' : 'DRW-260918-001' },
    ],
  },
  {
    key: 'assets',
    title: '卡牌资产',
    fields: [
      { label: '保管中', value: index ? '4 张' : '26 张' },
      { label: '锁定中', value: index ? '1 张' : '4 张' },
    ],
  },
  {
    key: 'fulfillment',
    title: '回收与发货',
    fields: [
      { label: '回收订单', value: index ? '1' : '6' },
      { label: '发货申请', value: index ? '1' : '3' },
    ],
  },
  {
    key: 'support',
    title: '工单与设备',
    fields: [
      { label: '开放工单', value: index ? '1' : '1' },
      { label: '活跃设备', value: index ? '3' : '2' },
    ],
  },
  {
    key: 'risk',
    title: '风险与限制',
    fields: [
      { label: '风险等级', value: config.risks?.[index] ?? 'normal' },
      { label: '抽卡权限', value: index ? '已冻结' : '正常' },
      { label: '年龄确认', value: '已确认' },
      { label: '双绑定', value: '已完成' },
    ],
  },
]

const drawSections = (config: FixtureConfig, index: number): BusinessSection[] => [
  ...genericSections('drawOrders', config, index),
  {
    key: 'transaction',
    title: '原子事务',
    fields: [
      { label: '扣款前余额', value: index ? '2,580 Coin' : '23,640 Coin' },
      { label: '扣款后余额', value: index ? '2,080 Coin' : '18,640 Coin' },
      { label: '关联账本', value: index ? 'LED-000204' : 'LED-000101', copyable: true },
      { label: '事务结果', value: index ? '等待最终状态' : '余额、库存、结果与资产同时提交' },
    ],
  },
  {
    key: 'results',
    title: '结果与概率快照',
    fields: [
      { label: '结果数量', value: index ? '1 张' : '10 张' },
      { label: '结果摘要', value: index ? '等待服务端返回' : 'S×1、A×2、B×7' },
      { label: '抽取前库存', value: '20' },
      { label: '抽取后库存', value: index ? '19' : '10' },
      { label: '概率快照', value: '按抽取前剩余名额固化' },
      { label: '重抽/改奖', value: '禁止' },
    ],
  },
]

const shipmentSections = (config: FixtureConfig, index: number): BusinessSection[] => [
  ...genericSections('shipments', config, index),
  {
    key: 'cards',
    title: '卡牌与分配',
    fields: [
      { label: '卡牌数量', value: index ? '2 张' : '4 张' },
      { label: '实体编号', value: index ? '待模板分配' : 'PHY-000101, PHY-000102' },
      { label: '扫码核对', value: index ? '等待分配' : '4 / 4 一致' },
      { label: '出库限制', value: '实体卡与订单不一致时禁止出库' },
    ],
  },
  {
    key: 'logistics',
    title: '地址与物流',
    fields: [
      {
        label: '地址快照',
        value: index ? '东京都 渋谷区 ***' : '上海市 浦东新区 ***',
        sensitive: true,
      },
      { label: '承运商', value: index ? '未分配' : 'DHL' },
      { label: '追踪号', value: index ? '—' : 'DHL****8821', sensitive: true },
      { label: '用户端状态', value: index ? '待发货' : '待审核' },
    ],
  },
]

const makeRecord = (module: BusinessModuleKey, index: number): BusinessRecord => {
  const config = configs[module]
  const id = `${config.prefix}-${String(index + 1).padStart(6, '0')}`
  let sections = genericSections(module, config, index)
  if (module === 'users') sections = userSections(config, index)
  if (module === 'drawOrders' || module === 'anomalies') sections = drawSections(config, index)
  if (
    module === 'shipments' ||
    module === 'pickLists' ||
    module === 'returns' ||
    module === 'exceptions'
  )
    sections = shipmentSections(config, index)
  return {
    id,
    module,
    title: config.titles[index],
    secondary: config.secondary[index],
    status: config.statuses[index],
    summaryA: config.summaryA[index],
    summaryB: config.summaryB[index],
    summaryC: config.summaryC[index],
    risk: config.risks?.[index] ?? 'normal',
    requestId: `req_${module}_${index + 1}`,
    idempotencyKey: `idem_${module}_${index + 1}`,
    updatedAt: index ? '2026-09-18T13:08:00+08:00' : '2026-09-18T14:22:00+08:00',
    sections,
    actions: actionsFor(module, index),
    timeline: [
      {
        id: `EVT-${module}-${index + 1}`,
        action: '记录创建',
        operator: 'system',
        reason: '业务服务写入可信状态',
        result: 'succeeded',
        requestId: `req_${module}_${index + 1}`,
        createdAt: index ? '2026-09-18T13:08:00+08:00' : '2026-09-18T14:22:00+08:00',
      },
    ],
  }
}

const records = Object.fromEntries(
  (Object.keys(configs) as BusinessModuleKey[]).map((module) => [
    module,
    [makeRecord(module, 0), makeRecord(module, 1)],
  ]),
) as Record<BusinessModuleKey, BusinessRecord[]>

export const operations: OperationsRepository = {
  async listRecords(module, query) {
    await delay()
    const keyword = query.keyword?.trim().toLowerCase() ?? ''
    let filtered = records[module].filter((item) =>
      `${item.id} ${item.title} ${item.secondary} ${item.summaryA} ${item.summaryB}`
        .toLowerCase()
        .includes(keyword),
    )
    if (query.status) filtered = filtered.filter((item) => item.status === query.status)
    if (query.risk) filtered = filtered.filter((item) => item.risk === query.risk)
    const start = (query.page - 1) * query.pageSize
    return {
      items: clone(filtered.slice(start, start + query.pageSize)),
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
    }
  },
  async getRecord(module, id) {
    await delay()
    const record = records[module].find((item) => item.id === id)
    if (!record) throw new RepositoryError('未找到对应业务记录', 'BUSINESS_RECORD_NOT_FOUND')
    return clone(record)
  },
  async executeAction(module, id, command) {
    await delay()
    const record = records[module].find((item) => item.id === id)
    if (!record) throw new RepositoryError('未找到对应业务记录', 'BUSINESS_RECORD_NOT_FOUND')
    const action = record.actions.find((item) => item.key === command.action)
    if (!action) throw new RepositoryError('当前状态不允许执行此操作', 'ACTION_NOT_ALLOWED')
    if (command.reason.trim().length < 5)
      throw new RepositoryError('请填写至少 5 个字的操作原因', 'REASON_REQUIRED')
    if (command.verificationCode !== '123456')
      throw new RepositoryError('双重验证码错误', 'INVALID_TWO_FACTOR')
    if (action.targetStatus) record.status = action.targetStatus
    record.requestId = command.context.requestId
    record.idempotencyKey = command.context.idempotencyKey
    record.updatedAt = command.context.requestedAt
    record.timeline.unshift({
      id: `EVT-${Date.now()}`,
      action: action.label,
      operator: 'ADM-0001',
      reason: command.reason,
      result: 'succeeded',
      requestId: command.context.requestId,
      createdAt: command.context.requestedAt,
    })
    const recordIndex = records[module].indexOf(record)
    record.actions = actionsFor(module, Math.max(0, recordIndex), record.status)
    return clone(record)
  },
  async saveRecord(module, id, command) {
    await delay()
    const record = records[module].find((item) => item.id === id)
    if (!record) throw new RepositoryError('未找到对应业务记录', 'BUSINESS_RECORD_NOT_FOUND')
    if (command.reason.trim().length < 5)
      throw new RepositoryError('请填写至少 5 个字的保存说明', 'REASON_REQUIRED')
    if (
      module === 'coinLedger' ||
      module === 'recycles' ||
      module === 'deliveryRecords' ||
      module === 'loginRecords'
    )
      throw new RepositoryError('该记录只读，不允许覆盖', 'IMMUTABLE_RECORD')
    record.sections = clone(command.sections)
    if (['banners', 'homeSections', 'faq', 'staticPages', 'localization'].includes(module))
      record.status = 'draft'
    record.requestId = command.context.requestId
    record.idempotencyKey = command.context.idempotencyKey
    record.updatedAt = command.context.requestedAt
    record.timeline.unshift({
      id: `EVT-${Date.now()}`,
      action: '保存配置',
      operator: 'ADM-0001',
      reason: command.reason,
      result: 'succeeded',
      requestId: command.context.requestId,
      createdAt: command.context.requestedAt,
    })
    return clone(record)
  },
}
