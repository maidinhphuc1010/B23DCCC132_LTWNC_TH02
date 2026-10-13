import { useMemo } from 'react';
import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import { useAppSelector } from '@/features/assignments';
import { calcStats } from '@/features/assignments/stats';

export default function AssignmentStatistics() {
  const items = useAppSelector((state) => state.assignments.items);
  const stats = useMemo(() => calcStats(items), [items]);
  const subjects = useMemo(() => Object.entries(stats.bySubject).map(([subject, count]) => ({ subject, count })), [stats]);
  return (
    <section aria-label='Thống kê bài tập' data-testid='assignment-statistics'>
      <Typography.Title level={3}>Thống kê bài tập</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card><Statistic title='Tổng số bài' value={stats.total} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title='Đã hoàn thành' value={stats.completed} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title='Quá hạn' value={stats.overdue} /></Card></Col>
      </Row>
      <Table rowKey='subject' dataSource={subjects} pagination={false} columns={[
        { title: 'Môn học', dataIndex: 'subject' },
        { title: 'Số bài tập', dataIndex: 'count' },
      ]} />
    </section>
  );
}
