import { InfoBox, type FeedbackTone } from './info-box';

type ToastProps = {
  message: string;
  tone?: FeedbackTone;
};

export function Toast({ message, tone = 'info' }: ToastProps) {
  return <InfoBox description={message} tone={tone} />;
}
