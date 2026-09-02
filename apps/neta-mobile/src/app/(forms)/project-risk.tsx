import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ProjectListItem, ProjectRiskAnalysis } from '@neta/api-contracts';

import { FormSheet, RelationPickerField } from '@/components/forms';
import { Badge, InfoBox } from '@/components/ui';
import { analyzeProjectRisk } from '@/features/chat/api';
import { listProjects } from '@/features/projects/api';
import { toClientError } from '@/lib/api/errors';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function ProjectRiskRoute() {
  const session = useSession(); const { isOnline } = useAppEnvironment(); const { colors } = useTheme(); const scrollRef = useRef<ScrollView>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]); const [projectId, setProjectId] = useState(''); const [risk, setRisk] = useState<ProjectRiskAnalysis | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; let active = true; void listProjects(session.instance, session.user, {}).then((result) => { if (active) setProjects(result.data.items); }).catch((value) => active && setError(toClientError(value, 'Proje seçenekleri alınamadı.').message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [session]);
  const analyze = async () => { if (!projectId || !isOnline || session.status !== 'authenticated' || session.role !== 'freelancer') return; setLoading(true); setRisk(null); setError(null); try { setRisk((await analyzeProjectRisk(session.instance, session.user, projectId)).data); } catch (value) { setError(toClientError(value, 'Proje risk analizi oluşturulamadı.').message); } finally { setLoading(false); } };
  return <FormSheet dirty={false} onSubmit={() => void analyze()} scrollRef={scrollRef} submitDisabled={!isOnline || !projectId} submitLabel="Riski analiz et" submitting={loading} title="Proje risk analizi"><Text style={[styles.lead, { color: colors.textMuted }]}>İlerleme, görev ve teslim tarihleri üzerinden risk sinyallerini değerlendirir. Sonuç karar desteğidir.</Text>{!isOnline ? <InfoBox description="Risk analizi için internet bağlantısı gerekir." title="Çevrimdışı" tone="warning" /> : null}{error ? <InfoBox description={error} title="Analiz oluşturulamadı" tone="danger" /> : null}<RelationPickerField label="Proje" onChange={(value) => { setProjectId(value ?? ''); setRisk(null); }} options={projects.map((project) => ({ ...(project.clientName ? { description: project.clientName } : {}), id: project.id, label: project.title }))} value={projectId || null} />{risk ? <View accessible accessibilityLabel={`Risk seviyesi ${risk.riskLevel}. ${risk.summary}`} style={styles.result}><Badge tone={risk.riskLevel === 'high' ? 'danger' : risk.riskLevel === 'medium' ? 'warning' : 'success'}>{risk.riskLevel}</Badge><Text style={[styles.summary, { color: colors.text }]}>{risk.summary}</Text>{risk.recommendations.map((item) => <Text key={item} style={[styles.recommendation, { color: colors.textMuted }]}>• {item}</Text>)}</View> : null}</FormSheet>;
}

const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22 }, recommendation: { fontSize: 14, lineHeight: 21 }, result: { gap: spacing.sm }, summary: { fontSize: 16, fontWeight: '700', lineHeight: 23 } });
