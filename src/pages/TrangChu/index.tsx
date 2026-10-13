/* eslint-disable @typescript-eslint/no-use-before-define */
import { BulbOutlined, DeleteOutlined, EditOutlined, PushpinFilled, PushpinOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Form, Input, Modal, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { Provider } from 'react-redux';
import { memo, useEffect, useState } from 'react';
import {
	addAssignment,
	updateAssignment,
	fetchAssignments,
	getDateDiff,
	priorityLabels,
	removeAssignment,
	store,
	toggleAssignment,
	useAppDispatch,
	useAppSelector,
	useAssignmentFilters,
	ThemeProvider,
	usePinStore,
	useTheme,
} from '@/features/assignments';
import type { Assignment, AssignmentStatus, NewAssignment, Priority } from '@/features/assignments';
import './style.less';

const { Title, Text } = Typography;

const ThemeToggle = () => {
	const { mode, toggleTheme } = useTheme();
	return (
		<Button className='theme-toggle' icon={<BulbOutlined />} onClick={toggleTheme}>
			{mode === 'light' ? 'Chủ đề tối' : 'Chủ đề sáng'}
		</Button>
	);
};

const AssignmentFilters = ({
	value,
	onChange,
}: {
	value: AssignmentStatus;
	onChange: (value: AssignmentStatus) => void;
}) => (
	<div className='assignment-filters'>
		<Text strong>Lọc trạng thái</Text>
		<Select
			value={value}
			onChange={onChange}
			options={[
				{ value: 'all', label: 'Tất cả' },
				{ value: 'pending', label: 'Chưa hoàn thành' },
				{ value: 'overdue', label: 'Quá hạn' },
				{ value: 'completed', label: 'Đã hoàn thành' },
			]}
		/>{' '}
	</div>
);

const AssignmentForm = ({ assignment, onClose }: { assignment?: Assignment; onClose: () => void }) => {
	const [form] = Form.useForm<NewAssignment>();
	const dispatch = useAppDispatch();
	const isEditing = Boolean(assignment);
	const submit = (values: NewAssignment) => {
		if (assignment) {
			dispatch(updateAssignment({ id: assignment.id, changes: values }));
			message.success('Đã cập nhật bài tập');
		} else {
			dispatch(addAssignment(values));
			message.success('Đã thêm bài tập mới');
		}
		form.resetFields();
		onClose();
	};
	return (
		<Form
			form={form}
			layout='vertical'
			onFinish={submit}
			initialValues={assignment ?? { priority: 'medium' as Priority }}
		>
			<Form.Item name='subject' label='Môn học' rules={[{ required: true, message: 'Nhập môn học' }]}>
				<Input placeholder='Ví dụ: TypeScript' />
			</Form.Item>
			<Form.Item name='title' label='Tên bài tập' rules={[{ required: true, message: 'Nhập tên bài tập' }]}>
				<Input placeholder='Nhập tên bài tập' />
			</Form.Item>
			<Form.Item name='dueDate' label='Hạn nộp' rules={[{ required: true, message: 'Chọn hạn nộp' }]}>
				<Input type='date' />
			</Form.Item>
			<Form.Item name='priority' label='Ưu tiên'>
				<Select options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
			</Form.Item>
			<Space className='modal-actions'>
				<Button onClick={onClose}>Hủy</Button>
				<Button type='primary' htmlType='submit' icon={isEditing ? <EditOutlined /> : <PlusOutlined />}>
					{isEditing ? 'Lưu thay đổi' : 'Thêm bài tập'}
				</Button>
			</Space>
		</Form>
	);
};

const AddAssignmentButton = () => {
	const [visible, setVisible] = useState(false);
	return (
		<>
			<Button type='primary' size='large' icon={<PlusOutlined />} onClick={() => setVisible(true)}>
				Thêm bài tập
			</Button>
			<Modal title='Thêm bài tập mới' visible={visible} onCancel={() => setVisible(false)} footer={null} destroyOnClose>
				<AssignmentForm onClose={() => setVisible(false)} />
			</Modal>
		</>
	);
};

const AssignmentList = () => {
	const dispatch = useAppDispatch();
	const { items, status, error } = useAppSelector((state) => state.assignments);
	const { status: filter, setStatus, filteredAssignments } = useAssignmentFilters(items);
	const pinnedIds = usePinStore((state) => state.pinnedIds);
	const orderedAssignments = [...filteredAssignments].sort((left, right) => Number(pinnedIds.includes(right.id)) - Number(pinnedIds.includes(left.id)));
	useEffect(() => {
		if (status === 'idle') dispatch(fetchAssignments());
	}, [dispatch, status]);
	return (
		<>
			<div className='list-toolbar'>
				<div>
					<Title level={4}>
						Danh sách bài tập <Tag color='blue'>{orderedAssignments.length}</Tag>
					</Title>
					<Text type='secondary'>Theo dõi tiến độ học tập của bạn</Text>
				</div>
				<Space>
					<AssignmentFilters value={filter} onChange={setStatus} />
					<Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAssignments())}>
						Tải lại
					</Button>
				</Space>
			</div>
			{status === 'loading' && (
				<div className='loading'>
					<Spin tip='Đang tải bài tập mẫu...' />
				</div>
			)}
			{error && <Text type='danger'>{error}</Text>}
			{status !== 'loading' && orderedAssignments.length === 0 && <Empty description='Không có bài tập phù hợp' />}
			<div className='assignment-list'>
				{orderedAssignments.map((assignment) => (
					<AssignmentCard key={assignment.id} assignment={assignment} />
				))}
			</div>
		</>
	);
};

const AssignmentCard = memo(({ assignment }: { assignment: Assignment }) => {
	const dispatch = useAppDispatch();
	const togglePin = usePinStore((state) => state.togglePin);
	const pinned = usePinStore((state) => state.pinnedIds.includes(assignment.id));
	const [editing, setEditing] = useState(false);
	const days = getDateDiff(assignment.dueDate);
	const overdue = !assignment.completed && days < 0;
	const confirmToggle = () => {
		Modal.confirm({
			title: assignment.completed ? 'Bỏ hoàn thành bài tập?' : 'Đánh dấu bài tập đã hoàn thành?',
			content: assignment.completed ? `Bạn có chắc muốn bỏ trạng thái hoàn thành của “${assignment.title}”?` : `Bạn có chắc “${assignment.title}” đã hoàn thành?`,
			okText: 'Xác nhận', cancelText: 'Hủy', okButtonProps: { danger: false },
			onOk: () => dispatch(toggleAssignment(assignment.id)),
		});
	};
	const confirmRemove = () => {
		Modal.confirm({
			title: 'Xóa bài tập?', content: `Bạn có chắc muốn xóa “${assignment.title}”? Hành động này không thể hoàn tác.`,
			okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true },
			onOk: () => dispatch(removeAssignment(assignment.id)),
		});
	};
	return (
		<Card className={`assignment-card ${assignment.completed ? 'is-completed' : ''} ${pinned ? 'is-pinned' : ''}`} bordered={false}>
			<div className='assignment-main'>
				<div className='assignment-subject'>{assignment.subject}</div>
				<Title level={5} className='assignment-title'>{assignment.title}</Title>
				<Text type='secondary'>Hạn nộp: {new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString('vi-VN')}</Text>
			</div>
			<div className='assignment-meta'>
				<Tag color={assignment.priority === 'high' ? 'red' : assignment.priority === 'medium' ? 'orange' : 'green'}>{priorityLabels[assignment.priority]}</Tag>
				<Text className={overdue ? 'overdue' : assignment.completed ? 'done' : 'remaining'}>{assignment.completed ? 'Đã hoàn thành' : overdue ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}</Text>
			</div>
			<Space>
				<Button size='small' icon={pinned ? <PushpinFilled /> : <PushpinOutlined />} aria-label={pinned ? 'Bỏ ghim bài tập' : 'Ghim bài tập'} onClick={() => togglePin(assignment.id)} />
				<Button size='small' type={assignment.completed ? 'default' : 'primary'} onClick={confirmToggle}>{assignment.completed ? 'Bỏ hoàn thành' : 'Hoàn thành'}</Button>
				<Button size='small' icon={<EditOutlined />} aria-label='Sửa bài tập' onClick={() => setEditing(true)} />
				<Button danger type='text' icon={<DeleteOutlined />} aria-label='Xóa bài tập' onClick={confirmRemove} />
			</Space>
			<Modal title='Sửa bài tập' visible={editing} onCancel={() => setEditing(false)} footer={null} destroyOnClose><AssignmentForm assignment={assignment} onClose={() => setEditing(false)} /></Modal>
		</Card>
	);
});


const Dashboard = () => (
	<Provider store={store}>
		<ThemeProvider>
			<DashboardContent />
		</ThemeProvider>
	</Provider>
);
const DashboardContent = () => {
	const completed = useAppSelector((state) => state.assignments.items.filter((item) => item.completed).length);
	return (
		<div className='assignment-page'>
			<div className='hero'>
				<div>
					<Text className='eyebrow'>PERSONAL LEARNING PLANNER</Text>
					<Title>Bài tập của tôi</Title>
					<Text className='hero-description'>Quản lý deadline, ưu tiên và tiến độ học tập trong một nơi.</Text>
				</div>
				<div className='hero-stat'>
					<span>{completed}</span>
					<Text>đã hoàn thành</Text>
				</div>
			</div>
			<div className='assignment-actions'>
				<ThemeToggle />
				<AddAssignmentButton />
			</div>
			<AssignmentList />
		</div>
	);
};

export default Dashboard;
