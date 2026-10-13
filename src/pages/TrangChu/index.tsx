/* eslint-disable @typescript-eslint/no-use-before-define */
import { BulbOutlined, DeleteOutlined, EditOutlined, PushpinFilled, PushpinOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Form, Input, Modal, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { Provider } from 'react-redux';
import { lazy, memo, Profiler, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import { useDebounce } from '@/features/assignments/hooks';

const AssignmentStatistics = lazy(() => import('./Statistics'));
import {
	addAssignment,
	updateAssignment,
	generateSampleAssignments,
	fetchAssignments,

	getDateDiff,
	priorityLabels,
	removeAssignment,
	replaceAssignments,
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

let assignmentCardRenderCount = 0;


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

export const AssignmentForm = ({ assignment, onClose }: { assignment?: Assignment; onClose: () => void }) => {
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

const StressTestButton = () => {
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const createSamples = () => {
		Modal.confirm({
			title: 'Tạo 10.000 bài tập mẫu?',
			content: 'Danh sách hiện tại sẽ được thay thế để đo hiệu năng baseline.',
			okText: 'Tạo dữ liệu', cancelText: 'Hủy',
			onOk: () => {
				setLoading(true);
				window.requestAnimationFrame(() => {
					dispatch(replaceAssignments(generateSampleAssignments()));
					setLoading(false);
					message.success('Đã tạo 10.000 bài tập mẫu');
				});
			},
		});
	};
	return <Button icon={<ReloadOutlined />} loading={loading} onClick={createSamples}>Tạo 10.000 bài tập mẫu</Button>;
};

export const AssignmentList = () => {

	const dispatch = useAppDispatch();
	const [query, setQuery] = useState('');
	const [renderCount, setRenderCount] = useState(0);
	const { items, status, error } = useAppSelector((state) => state.assignments);

	const debouncedQuery = useDebounce(query, 300);
	const { status: filter, setStatus, filteredAssignments } = useAssignmentFilters(items, debouncedQuery);
	const pinnedIds = usePinStore((state) => state.pinnedIds);
	const orderedAssignments = useMemo(() => {
		const pinned = new Set(pinnedIds);
		return [...filteredAssignments].sort((left, right) => Number(pinned.has(right.id)) - Number(pinned.has(left.id)));
	}, [filteredAssignments, pinnedIds]);
	const togglePin = usePinStore((state) => state.togglePin);
	const onToggle = useCallback((id: string) => { dispatch(toggleAssignment(id)); }, [dispatch]);
	const onRemove = useCallback((id: string) => { dispatch(removeAssignment(id)); }, [dispatch]);
	const [editing, setEditing] = useState<Assignment>();
	const onEdit = useCallback((assignment: Assignment) => setEditing(assignment), []);
	const closeEdit = useCallback(() => setEditing(undefined), []);
	const rowData = useMemo(() => ({ items: orderedAssignments, onToggle, onRemove, onPin: togglePin, onEdit }), [orderedAssignments, onToggle, onRemove, togglePin, onEdit]);
	const listRef = useRef<FixedSizeList>(null);
	const [compact, setCompact] = useState(() => window.innerWidth <= 1100);
	useEffect(() => {
		const media = window.matchMedia('(max-width: 1100px)');
		const update = () => setCompact(media.matches);
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, []);
	useEffect(() => { listRef.current?.scrollToItem(0); }, [debouncedQuery, filter]);
	const handleSearch = (value: string) => {
		assignmentCardRenderCount = 0;
		setQuery(value);
	};
	useEffect(() => {
		if (items.length === 10000) {
			setRenderCount(assignmentCardRenderCount);
			console.info(`[Stress test] AssignmentCard render khi tìm kiếm "${query}": ${assignmentCardRenderCount}`);
		}
	}, [query, debouncedQuery, items.length]);
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
					<Input
						allowClear
						aria-label='Tìm kiếm bài tập'
						placeholder='Tìm môn học hoặc bài tập'
						value={query}
						onChange={(event) => handleSearch(event.target.value)}
					/>
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
			{items.length === 10000 && <Text className='stress-render-count' type='secondary'>Baseline: AssignmentCard render ở lần gõ gần nhất: {renderCount}</Text>}
			{status !== 'loading' && orderedAssignments.length === 0 && <Empty description='Không có bài tập phù hợp' />}
			<div className='assignment-list virtual-assignment-list' data-total-count={items.length} data-result-count={orderedAssignments.length} data-query={debouncedQuery}>
				<FixedSizeList ref={listRef} height={600} width='100%' itemCount={orderedAssignments.length}
					itemSize={compact ? 310 : 180} itemData={rowData} itemKey={assignmentRowKey} overscanCount={3}>
					{AssignmentRow}
				</FixedSizeList>
			</div>
			<Modal title='Sửa bài tập' visible={Boolean(editing)} onCancel={closeEdit} footer={null} destroyOnClose>
				{editing && <AssignmentForm assignment={editing} onClose={closeEdit} />}
			</Modal>
		</>
	);
};

interface CardActions {
	onToggle: (id: string) => void;
	onRemove: (id: string) => void;
	onPin: (id: string) => void;
	onEdit: (assignment: Assignment) => void;
}
interface AssignmentRowData extends CardActions { items: Assignment[] }
const assignmentRowKey = (index: number, data: AssignmentRowData) => data.items[index].id;
const AssignmentRow = ({ index, style, data }: ListChildComponentProps<AssignmentRowData>) => (
	<div style={style} className='assignment-virtual-row'>
		<AssignmentCard assignment={data.items[index]} onToggle={data.onToggle} onRemove={data.onRemove} onPin={data.onPin} onEdit={data.onEdit} />
	</div>
);
export const AssignmentCard = memo(({ assignment, onToggle, onRemove, onPin, onEdit }: { assignment: Assignment } & CardActions) => {
	assignmentCardRenderCount += 1;
	const pinned = usePinStore((state) => state.pinnedIds.includes(assignment.id));
	const days = getDateDiff(assignment.dueDate);
	const overdue = !assignment.completed && days < 0;
	const confirmToggle = () => {
		Modal.confirm({
			title: assignment.completed ? 'Bỏ hoàn thành bài tập?' : 'Đánh dấu bài tập đã hoàn thành?',
			content: assignment.completed ? `Bạn có chắc muốn bỏ trạng thái hoàn thành của “${assignment.title}”?` : `Bạn có chắc “${assignment.title}” đã hoàn thành?`,
			okText: 'Xác nhận', cancelText: 'Hủy', okButtonProps: { danger: false },
			onOk: () => onToggle(assignment.id),
		});
	};
	const confirmRemove = () => {
		Modal.confirm({
			title: 'Xóa bài tập?', content: `Bạn có chắc muốn xóa “${assignment.title}”? Hành động này không thể hoàn tác.`,
			okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true },
			onOk: () => onRemove(assignment.id),
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
				<Button size='small' icon={pinned ? <PushpinFilled /> : <PushpinOutlined />} aria-label={pinned ? 'Bỏ ghim bài tập' : 'Ghim bài tập'} onClick={() => onPin(assignment.id)} />
				<Button size='small' type={assignment.completed ? 'default' : 'primary'} onClick={confirmToggle}>{assignment.completed ? 'Bỏ hoàn thành' : 'Hoàn thành'}</Button>
				<Button size='small' icon={<EditOutlined />} aria-label='Sửa bài tập' onClick={() => onEdit(assignment)} />
				<Button danger type='text' icon={<DeleteOutlined />} aria-label='Xóa bài tập' onClick={confirmRemove} />
			</Space>

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
	const [showStatistics, setShowStatistics] = useState(false);
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
				<Button onClick={() => setShowStatistics((value) => !value)}>{showStatistics ? 'Danh sách' : 'Thống kê'}</Button>
				<StressTestButton />
				<AddAssignmentButton />
			</div>
			{showStatistics ? <Suspense fallback={<Spin tip='Đang tải thống kê...' />}><AssignmentStatistics /></Suspense> : process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('benchmark') === '10000' ? (
				<Profiler id='AssignmentList' onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
					window.dispatchEvent(new CustomEvent('assignment-profiler', { detail: {
						id, phase, actualDuration, baseDuration, startTime, commitTime,
						cardRenderCount: assignmentCardRenderCount,
					} }));
				}}><AssignmentList /></Profiler>
			) : <AssignmentList />}
		</div>
	);
};

export default Dashboard;
