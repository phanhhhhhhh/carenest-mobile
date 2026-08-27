import { useEffect, useState } from 'react';
import { ChatService } from '../../../../core/services/chatService';
import type { HealthMetric } from '../../../../shared/types';
import { METRIC_CONFIGS, type Status } from './metricConfig';

interface Params {
  latestByType: Record<string, HealthMetric>;
  getStatus: (data: HealthMetric) => Status;
}

/**
 * Owns the "Nhận định từ AI" card state. Auto-runs once when metrics first
 * appear; `reload` re-runs on demand. Falls back to a rule-based summary when
 * the backend chat call fails.
 */
export function useAiInsight({ latestByType, getStatus }: Params) {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const ruleBasedInsight = (): string => {
    const entries = Object.entries(latestByType);
    const abnormal = entries.filter(([, v]) => getStatus(v) !== 'normal');
    if (abnormal.length === 0) {
      return 'Tất cả chỉ số hôm nay của bạn đều trong ngưỡng bình thường. Hãy duy trì lối sống lành mạnh!';
    }
    const names = abnormal.map(([k]) => METRIC_CONFIGS[k]?.label ?? k).join(', ');
    return `Lưu ý: ${names} đang nằm ngoài ngưỡng bình thường. Hãy theo dõi sát và hỏi ý kiến bác sĩ nếu tình trạng này tiếp diễn.`;
  };

  const buildHealthPrompt = (): string => {
    const lines: string[] = [
      'Hãy phân tích ngắn gọn các chỉ số sức khỏe sau đây cho một người cao tuổi (trả lời bằng tiếng Việt, tối đa 3-4 câu, giọng điệu thân thiện như một trợ lý chăm sóc):',
    ];
    for (const [type, data] of Object.entries(latestByType)) {
      const config = METRIC_CONFIGS[type];
      if (config) {
        const display = data.valueSecondary ? `${data.value}/${data.valueSecondary}` : data.value;
        const dt = new Date(data.recordedAt);
        const timeStr = Number.isNaN(dt.getTime())
          ? ''
          : `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
        lines.push(`- ${config.label}: ${display} ${config.unit} (lúc ${timeStr})`);
      }
    }
    lines.push(
      'Đánh giá từng chỉ số, cảnh báo nếu có bất thường, và đưa ra một lời khuyên ngắn gọn.',
    );
    return lines.join('\n');
  };

  const reload = async () => {
    if (Object.keys(latestByType).length === 0) {
      setAiInsight(
        'Hãy bắt đầu theo dõi sức khỏe bằng cách thêm chỉ số đầu tiên. ' +
          'Tôi sẽ giúp bạn phân tích xu hướng và đưa ra lời khuyên phù hợp!',
      );
      setAiLoading(false);
      setAiError(null);
      return;
    }

    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const reply = await new ChatService().sendMessage(buildHealthPrompt());
      setAiInsight(reply);
      setAiLoading(false);
    } catch {
      setAiInsight(ruleBasedInsight());
      setAiLoading(false);
      setAiError('Không thể kết nối với AI, đang hiển thị phân tích cơ bản');
    }
  };

  useEffect(() => {
    if (!aiLoading && aiInsight == null && Object.keys(latestByType).length > 0) {
      reload();
    }
    // Re-run only when the metric set changes; `reload` closes over fresh state each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestByType]);

  return {
    aiInsight,
    aiLoading,
    aiError,
    displayText: aiInsight ?? ruleBasedInsight(),
    reload,
  };
}
