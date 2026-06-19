import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker } from './ColorPicker';
import React, { useState } from 'react';

const meta: Meta<typeof ColorPicker> = {
  title: 'UI/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

const ColorPickerWrapper: React.FC<{ label?: string }> = (args) => {
  const [value, setValue] = useState('blue-500');
  return <ColorPicker {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <ColorPickerWrapper {...args} />,
  args: {
    label: 'Project Accent Color',
  },
};
