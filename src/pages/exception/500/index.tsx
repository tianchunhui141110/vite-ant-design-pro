import { Button, Card, Result } from 'antd';
import { Link } from '@/max';

export default () => (
  <Card variant="borderless">
    <Result
      status="500"
      title="500"
      subTitle="Sorry, something went wrong."
      extra={
        <Link to="/" prefetch>
          <Button type="primary">Back Home</Button>
        </Link>
      }
    />
  </Card>
);
