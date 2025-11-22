'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BRAND_PRIMARY = '#8884d8';

export const EligibilityChart = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Trends (Last 12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_PRIMARY} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={BRAND_PRIMARY} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="Eligibility" stroke={BRAND_PRIMARY} fill="url(#colorUv)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
