import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, SegmentedButtons, useTheme, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

interface AnalyticsData {
  complaintsByStatus: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  complaintsOverTime: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  resolutionTime: {
    labels: string[];
    data: number[];
  };
  departmentPerformance: {
    labels: string[];
    data: number[];
  };
  topComplaintCategories: {
    labels: string[];
    data: number[];
    colors: string[];
  };
}

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getAnalytics({ timeRange });
      // setAnalyticsData(data);
      
      // Mock data for now
      setTimeout(() => {
        setAnalyticsData({
          complaintsByStatus: {
            labels: ['Resolved', 'In Progress', 'Pending'],
            data: [65, 25, 10],
            colors: ['#4caf50', '#2196f3', '#ff9800']
          },
          complaintsOverTime: {
            labels: timeRange === 'week' 
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              : timeRange === 'month'
                ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
                : timeRange === 'quarter'
                  ? ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
                  : ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
              data: timeRange === 'week' 
                ? [20, 45, 28, 80, 99, 43, 30]
                : timeRange === 'month'
                  ? [120, 190, 150, 200]
                  : timeRange === 'quarter'
                    ? [500, 600, 550, 700]
                    : [2000, 2500, 2300, 3000]
            }]
          },
          resolutionTime: {
            labels: ['<1d', '1-3d', '3-7d', '>7d'],
            data: [30, 45, 20, 5]
          },
          departmentPerformance: {
            labels: ['Sanitation', 'Roads', 'Water', 'Electricity', 'Public Health'],
            data: [85, 65, 45, 78, 60]
          },
          topComplaintCategories: {
            labels: ['Garbage', 'Potholes', 'Water Leaks', 'Street Lights', 'Drainage'],
            data: [35, 25, 20, 15, 5],
            colors: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336']
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  if (loading || !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Analytics Dashboard</Title>
        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'quarter', label: 'Quarter' },
            { value: 'year', label: 'Year' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.chartTitle}>Complaints by Status</Title>
          <View style={styles.chartContainer}>
            <PieChart
              data={analyticsData.complaintsByStatus.labels.map((label, i) => ({
                name: label,
                population: analyticsData.complaintsByStatus.data[i],
                color: analyticsData.complaintsByStatus.colors[i],
                legendFontColor: theme.colors.onSurface,
                legendFontSize: 12,
              }))}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.chartTitle}>Complaints Over Time</Title>
          <View style={styles.chartContainer}>
            <LineChart
              data={analyticsData.complaintsOverTime}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => theme.colors.primary,
                strokeWidth: 2,
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, styles.halfWidth]}>
          <Card.Content>
            <Title style={styles.chartTitle}>Resolution Time</Title>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: analyticsData.resolutionTime.labels,
                  datasets: [{
                    data: analyticsData.resolutionTime.data
                  }]
                }}
                width={screenWidth / 2 - 32}
                height={200}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => theme.colors.primary,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.halfWidth]}>
          <Card.Content>
            <Title style={styles.chartTitle}>Department Performance</Title>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: analyticsData.departmentPerformance.labels,
                  datasets: [{
                    data: analyticsData.departmentPerformance.data
                  }]
                }}
                width={screenWidth / 2 - 32}
                height={200}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => theme.colors.primary,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.chartTitle}>Top Complaint Categories</Title>
          <View style={styles.chartContainer}>
            <PieChart
              data={analyticsData.topComplaintCategories.labels.map((label, i) => ({
                name: label,
                population: analyticsData.topComplaintCategories.data[i],
                color: analyticsData.topComplaintCategories.colors[i],
                legendFontColor: theme.colors.onSurface,
                legendFontSize: 10,
              }))}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Card.Content>
            <Title style={styles.statValue}>1,254</Title>
            <Paragraph>Total Complaints</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
          <Card.Content>
            <Title style={styles.statValue}>87%</Title>
            <Paragraph>Resolution Rate</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#fff8e1' }]}>
          <Card.Content>
            <Title style={styles.statValue}>2.3d</Title>
            <Paragraph>Avg. Resolution Time</Paragraph>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
