import Form from 'hew/Form';
import Input from 'hew/Input';
import { Modal } from 'hew/Modal';
import Select, { Option } from 'hew/Select';
import React, { useCallback, useId, useState } from 'react';

import { paths } from 'routes/utils';
import { createWebhook } from 'services/api';
import { V1TriggerType, V1WebhookType } from 'services/api-ts-sdk/api';
import { RunState } from 'types';
import handleError, { DetError, ErrorLevel, ErrorType } from 'utils/error';
import { routeToReactUrl } from 'utils/routes';

const FORM_ID = 'create-webhook-form';

interface FormInputs {
  triggerEvents: RunState[];
  url: string;
  webhookType: V1WebhookType;
}

const WebhookCreateModalComponent: React.FC = () => {
  const idPrefix = useId();
  const [form] = Form.useForm<FormInputs>();
  const [disabled, setDisabled] = useState<boolean>(true);

  const onChange = useCallback(() => {
    const fields = form.getFieldsError();
    const hasError = fields.some((f) => f.errors.length);
    setDisabled(hasError);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();

    try {
      if (values) {
        await createWebhook({
          triggers: values.triggerEvents.map((state) => ({
            condition: { state },
            triggerType: V1TriggerType.EXPERIMENTSTATECHANGE,
          })),
          url: values.url,
          webhookType: values.webhookType,
        });
        routeToReactUrl(paths.webhooks());
        form.resetFields();
      }
    } catch (e) {
      if (e instanceof DetError) {
        handleError(e, {
          level: e.level,
          publicMessage: e.publicMessage,
          publicSubject: 'Unable to create webhook.',
          silent: false,
          type: e.type,
        });
      } else {
        handleError(e, {
          level: ErrorLevel.Error,
          publicMessage: 'Please try again later.',
          publicSubject: 'Unable to create webhook.',
          silent: false,
          type: ErrorType.Server,
        });
      }
    }
  }, [form]);

  return (
    <Modal
      cancel
      size="small"
      submit={{
        disabled,
        form: idPrefix + FORM_ID,
        handleError,
        handler: handleSubmit,
        text: 'Create Webhook',
      }}
      title="New Webhook">
      <Form
        autoComplete="off"
        form={form}
        id={idPrefix + FORM_ID}
        layout="vertical"
        onFieldsChange={onChange}>
        <Form.Item
          label="URL"
          name="url"
          rules={[
            { message: 'URL is required.', required: true },
            { message: 'URL must be valid.', type: 'url', whitespace: true },
          ]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Type"
          name="webhookType"
          rules={[{ message: 'Webhook type is required ', required: true }]}>
          <Select placeholder="Select type of Webhook">
            <Option key={V1WebhookType.DEFAULT} value={V1WebhookType.DEFAULT}>
              Default
            </Option>
            <Option key={V1WebhookType.SLACK} value={V1WebhookType.SLACK}>
              Slack
            </Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Trigger"
          name="triggerEvents"
          rules={[{ message: 'At least one trigger event is required', required: true }]}>
          <Select mode="multiple" placeholder="Select trigger event">
            <Option key={RunState.Completed} value={RunState.Completed}>
              {RunState.Completed}
            </Option>
            <Option key={RunState.Error} value={RunState.Error}>
              {RunState.Error}
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WebhookCreateModalComponent;
