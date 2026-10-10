import type { BusinessModuleKey } from '@/domain/operations'

export interface BusinessModuleMeta {
  title: string
  eyebrow: string
  subtitle: string
  primaryLabel: string
  secondaryLabel: string
  tertiaryLabel: string
  detailRoute?: string
  detailParam?: string
  immutable?: boolean
}

const shared = (title: string, subtitle: string): BusinessModuleMeta => ({
  title,
  eyebrow: 'OPERATIONS CONTROL',
  subtitle,
  primaryLabel: '业务数据',
  secondaryLabel: '关联状态',
  tertiaryLabel: '说明',
})

export const businessModuleMeta: Record<BusinessModuleKey, BusinessModuleMeta> = {
  users: {
    ...shared('用户列表', '串联账户、Coin、充值、抽卡、资产、履约、工单、设备和风险信息。'),
    primaryLabel: '余额',
    secondaryLabel: '资产',
    tertiaryLabel: '最近登录',
    detailRoute: 'user-detail',
    detailParam: 'uid',
  },
  riskEvents: {
    ...shared('风险事件', '查看规则命中、风险等级和人工处置进度，不直接修改用户资产。'),
    primaryLabel: '命中摘要',
    secondaryLabel: '风险等级',
    tertiaryLabel: '规则',
  },
  coinLedger: {
    ...shared('Coin 账本', '只读、只追加的 Coin 流水；任何冲正都生成新的反向流水。'),
    primaryLabel: '变动金额',
    secondaryLabel: '变动前后',
    tertiaryLabel: '来源',
    immutable: true,
  },
  recharges: {
    ...shared('充值订单', '统一核对银行卡、支付宝和 USDT 支付状态；超时先查询最终状态。'),
    primaryLabel: '支付金额',
    secondaryLabel: '入账 Coin',
    tertiaryLabel: '支付方式',
    detailRoute: 'recharge-detail',
    detailParam: 'orderId',
  },
  rechargeTiers: {
    ...shared('充值档位', '维护固定档位和自定义金额边界，实际入账以服务端规则为准。'),
    primaryLabel: 'Coin',
    secondaryLabel: '首充奖励',
    tertiaryLabel: '类型',
  },
  refunds: {
    ...shared('退款', '退款必须关联原始单据并形成可审计反向流水。'),
    primaryLabel: '退款金额',
    secondaryLabel: '处理进度',
    tertiaryLabel: '来源',
  },
  chargebacks: {
    ...shared('拒付', '跟踪支付争议、举证时限与风险处置。'),
    primaryLabel: '争议金额',
    secondaryLabel: '响应状态',
    tertiaryLabel: '渠道',
  },
  adjustments: {
    ...shared('人工调账', '调账必须申请、复核、说明原因并上传证据；禁止删除账本。'),
    primaryLabel: '调整金额',
    secondaryLabel: '证据',
    tertiaryLabel: '复核状态',
  },
  drawOrders: {
    ...shared('抽卡订单', '核对扣款、库存、服务端结果、概率快照和原子事务。'),
    primaryLabel: '消耗 Coin',
    secondaryLabel: '结果',
    tertiaryLabel: '事务',
    detailRoute: 'draw-order-detail',
    detailParam: 'orderId',
  },
  anomalies: {
    ...shared('异常订单', '超时不等于失败；仅允许查询最终状态、退款或发起补偿审核。'),
    primaryLabel: '查询进度',
    secondaryLabel: '最终状态',
    tertiaryLabel: '优先级',
  },
  recycles: {
    ...shared('回收订单', '按抽中时锁定 Coin 执行，完成后不可撤销。'),
    primaryLabel: '回收 Coin',
    secondaryLabel: '资产状态',
    tertiaryLabel: '约束',
    detailRoute: 'recycle-detail',
    detailParam: 'orderId',
    immutable: true,
  },
  shipments: {
    ...shared('发货申请', '覆盖审核、模板分配、拣货、打包、出库、物流和签收。'),
    primaryLabel: '锁定 Coin',
    secondaryLabel: '地址快照',
    tertiaryLabel: '当前环节',
    detailRoute: 'shipment-detail',
    detailParam: 'shipmentId',
  },
  pickLists: {
    ...shared('拣货单', '扫码核对实体卡与订单；不一致时禁止出库。'),
    primaryLabel: '扫描进度',
    secondaryLabel: '拣货员',
    tertiaryLabel: '仓区',
  },
  returns: {
    ...shared('退件', '跟踪退件待检、重新入库、异常处置和用户确认。'),
    primaryLabel: '实体卡',
    secondaryLabel: '承运商',
    tertiaryLabel: '处理进度',
  },
  exceptions: {
    ...shared('履约异常', '集中处理实体不一致、模板缺口、地址、报关和物流异常。'),
    primaryLabel: '影响',
    secondaryLabel: '对象',
    tertiaryLabel: '优先级',
  },
  banners: {
    ...shared('首页 Banner', '维护桌面图、移动图、排序、排期和启用状态；同时启用不超过 5 张。'),
    primaryLabel: '排序',
    secondaryLabel: '内容完整度',
    tertiaryLabel: '排期',
  },
  homeSections: {
    ...shared('首页区块', '配置热门盲盒、平台保障和最新抽取动态等首页内容。'),
    primaryLabel: '启用状态',
    secondaryLabel: '版本',
    tertiaryLabel: '更新时间',
  },
  faq: {
    ...shared('FAQ', '编辑、排序、预览和发布简体中文问答。'),
    primaryLabel: '内容完整度',
    secondaryLabel: '版本',
    tertiaryLabel: '发布状态',
  },
  staticPages: {
    ...shared('静态页面', '维护关于我们、配送说明、条款和隐私政策，保留版本与回滚记录。'),
    primaryLabel: '版本',
    secondaryLabel: '完整性',
    tertiaryLabel: '发布状态',
  },
  localization: {
    ...shared('内容发布', '后台仅维护简体中文内容，发布前校验必填项并生成版本。'),
    primaryLabel: '简体中文',
    secondaryLabel: '版本',
    tertiaryLabel: '环境',
  },
  contentRelease: {
    ...shared('内容版本', '查看发布清单、操作者和回滚历史。'),
    primaryLabel: '变更项',
    secondaryLabel: '环境',
    tertiaryLabel: '发布时间',
  },
  tickets: {
    ...shared('客服工单', '处理用户消息、附件、关联单据、内部备注和用户可见回复。'),
    primaryLabel: '优先级',
    secondaryLabel: '负责人',
    tertiaryLabel: 'SLA',
    detailRoute: 'ticket-detail',
    detailParam: 'ticketId',
  },
  notificationTemplates: {
    ...shared('通知模板', '维护邮件、短信和站内通知；安全、支付和发货通知不可关闭。'),
    primaryLabel: '内容完整度',
    secondaryLabel: '开关约束',
    tertiaryLabel: '版本',
  },
  deliveryRecords: {
    ...shared('发送记录', '查看发送渠道、模板、送达结果、失败原因和重试次数。'),
    primaryLabel: '模板',
    secondaryLabel: '送达状态',
    tertiaryLabel: '发送时间',
    immutable: true,
  },
  loginRecords: {
    ...shared('登录记录', '审查管理员登录地点、设备、双重验证和异常锁定。'),
    primaryLabel: '设备',
    secondaryLabel: 'IP',
    tertiaryLabel: '验证结果',
    immutable: true,
  },
  systemSettings: {
    ...shared('系统配置', '维护会话、双重验证和业务阈值；每次修改都要求二次确认。'),
    primaryLabel: '当前配置',
    secondaryLabel: '约束',
    tertiaryLabel: '范围',
  },
}

export const businessModuleKeys = Object.keys(businessModuleMeta) as BusinessModuleKey[]
