/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AdminNewOrderProps {
  orderId?: string
  customerEmail?: string
  amount?: number // cents
  discountApplied?: boolean
  heroName?: string
  gender?: string
  petName?: string
  petType?: string
  favoriteColor?: string
  favoriteFood?: string
  city?: string
}

const fmt = (v?: string) => (v && v.length > 0 ? v : '—')

const AdminNewOrderEmail = ({
  orderId = '',
  customerEmail = '',
  amount = 0,
  discountApplied = false,
  heroName,
  gender,
  petName,
  petType,
  favoriteColor,
  favoriteFood,
  city,
}: AdminNewOrderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New ArtBookMagic order from {fmt(customerEmail)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Storybook Order</Heading>
        <Text style={text}>
          <strong>Order ID:</strong> {orderId}
        </Text>
        <Text style={text}>
          <strong>Customer:</strong> {customerEmail}
        </Text>
        <Text style={text}>
          <strong>Amount:</strong> ${(amount / 100).toFixed(2)} USD
        </Text>
        <Text style={text}>
          <strong>Discount Applied:</strong> {discountApplied ? 'Yes' : 'No'}
        </Text>
        <Hr style={hr} />
        <Heading as="h2" style={h2}>
          Personalization
        </Heading>
        <Section>
          <Text style={text}>
            <strong>Hero Name:</strong> {fmt(heroName)}
          </Text>
          <Text style={text}>
            <strong>Gender:</strong> {fmt(gender)}
          </Text>
          <Text style={text}>
            <strong>Pet:</strong> {fmt(petName)} ({fmt(petType)})
          </Text>
          <Text style={text}>
            <strong>Favorite Color:</strong> {fmt(favoriteColor)}
          </Text>
          <Text style={text}>
            <strong>Favorite Food:</strong> {fmt(favoriteFood)}
          </Text>
          <Text style={text}>
            <strong>City:</strong> {fmt(city)}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNewOrderEmail,
  subject: (data: Record<string, any>) =>
    `New Order Received - ${data.orderId ?? ''}`,
  displayName: 'Admin new-order notification',
  previewData: {
    orderId: '00000000-0000-0000-0000-000000000000',
    customerEmail: 'customer@example.com',
    amount: 500,
    discountApplied: false,
    heroName: 'Mia',
    gender: 'girl',
    petName: 'Biscuit',
    petType: 'dog',
    favoriteColor: 'purple',
    favoriteFood: 'pancakes',
    city: 'Singapore',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Fredoka', 'Trebuchet MS', sans-serif",
  color: '#0A0A0A',
}
const container = { padding: '24px 28px', maxWidth: '600px', margin: '0 auto' }
const h1 = {
  fontSize: '22px',
  fontWeight: 600 as const,
  color: '#FF8B00',
  margin: '0 0 16px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 600 as const,
  color: '#0A0A0A',
  margin: '16px 0 8px',
}
const text = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.5',
  margin: '0 0 6px',
}
const hr = {
  borderColor: '#FFE97F',
  margin: '20px 0',
}