/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderReady } from './order-ready.tsx'
import { template as adminNewOrder } from './admin-new-order.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-ready': orderReady,
  'admin-new-order': adminNewOrder,
}