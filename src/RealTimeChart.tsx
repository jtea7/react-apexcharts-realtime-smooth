import { ApexOptions } from 'apexcharts';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactApexChart from 'react-apexcharts';

const seriesCount = 60;

const apexOptions: ApexOptions = {
  chart: {
    type: 'area',
    // height: 350,
    zoom: {
      enabled: false,
    },
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        enabled: true,
        speed: 1000,
      },
    },
    toolbar: {
      show: false,
    },
  },
  annotations: {
    yaxis: [
      {
        y: 60,
        borderColor: '#00E396',
        // label: {
        //   borderColor: '#00E396',
        //   style: {
        //     color: '#fff',
        //     background: '#00E396',
        //   },
        //   text: 'Y-axis annotation on 8800',
        // },
      },
    ],
  },
  tooltip: {
    enabled: false,
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'straight',
    width: 1,
  },

  title: {
    text: '주파수',
    align: 'left',
  },
  xaxis: {
    type: 'numeric',
    tickAmount: 6,
    range: seriesCount,
    labels: {
      formatter: (val) => (seriesCount - Number(val)).toFixed(0) + '초전',
    },
  },
  yaxis: {
    min: 0,
    max: 100,
    labels: {
      formatter: (val) => val.toFixed(0),
    },
    title: { text: '주파수' },
    // opposite: true,
  },
  legend: {
    horizontalAlign: 'left',
  },
};

type TSeriesData = { x: number; y: number | null }[];
type TSeries = { data: TSeriesData }[];

const getInitialSeries = (initValues: number[]): TSeries => {
  const series: TSeriesData = [];

  let init: number[];
  if (initValues.length > seriesCount) {
    const len = initValues.length;
    init = initValues.slice(len - seriesCount, len);
  } else {
    init = initValues;
  }

  const start = seriesCount - init.length;
  for (let i = 1; i <= seriesCount; i++) {
    const diff = i - start - 1;
    series.push({ x: i, y: diff >= 0 ? init[diff] : null });
  }
  return [{ data: series }];
};

type Props = {
  initValues: number[];
  valueRef: MutableRefObject<number | null>;
};

export function RealTimeChart({ initValues, valueRef }: Props) {
  const [series, setSeries] = useState(() => getInitialSeries(initValues));
  //const [series, setSeries] = useState<TSeries>([{ name: 'test', data: [] }]);
  const [options, setOptions] = useState<ApexOptions>(() => apexOptions);
  const needAdd = useRef(false);
  const needSlice = useRef(false);

  const setAnimation = useCallback<(value: boolean) => void>(
    (value) => {
      const newOption = {
        ...options,
        chart: {
          ...options.chart,
          animations: { ...options.chart?.animations, enabled: value },
        },
      };
      setOptions(newOption);
    },
    [options]
  );

  const addData = useCallback<() => void>(() => {
    let dt = [...series[0].data];
    dt.forEach((x) => x.x--);
    dt.push({ x: seriesCount, y: valueRef.current });
    // 차트 포인트 없애기 위해 조기화
    //이걸 넣으니 시리즈 slice시 챠트 새로고침 현상 발생하여 삭제
    //dt[0].y = 0;
    console.log(dt.length);

    setSeries([{ data: [...dt] }]);
  }, [series, valueRef]);

  useEffect(() => {
    const timer = setInterval(() => {
      const len = series[0].data.length;
      if (len > seriesCount * 2) {
        // 1. 데이터가 많아지면 애니메이션 중지
        // 이번에 추가할 데이터는 데이터 잘라낸 다음에 추가한다. -> 4번
        needSlice.current = true;
        setAnimation(false);
      } else {
        addData();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [addData, series, setAnimation]);

  useEffect(() => {
    const aniEnable = options.chart?.animations?.enabled;

    if (!aniEnable) {
      if (needSlice.current) {
        needSlice.current = false;

        let dt = [...series[0].data];
        // 2. 애니메이션 중지 되면 데이터를 잘라낸다.
        dt = dt.slice(seriesCount, dt.length);
        const newSeries = { ...series[0], data: dt };
        setSeries([newSeries]);
      } else {
        // 3. 애니메이션 중지 후 데이터를 잘라낸 시리즈로 업데이트된 상태이다.
        // 애니메이션을 다시 재생 시키고 이전에 저장 못한 데이터를 저장하도록 플래그 설정
        needAdd.current = true;
        setAnimation(true);
      }
    } else {
      // 4. 시리즈를 잘라내는라 저장 못한 데이터를 추가한다.
      if (needAdd.current) {
        needAdd.current = false;
        addData();
      }
    }
  }, [addData, options.chart?.animations?.enabled, series, setAnimation]);

  return <ReactApexChart options={options} series={series} type="area" />;
}

export default function RealTimeChartTest() {
  //const initValues = [50, 50, 50, 10];
  //const lastValue = 50;
  const initValues: number[] = [];
  const lastValue = null;
  const [value, setValue] = useState<number | null>(lastValue);
  const valueRef = useRef<number | null>(lastValue);

  useEffect(() => {
    const timer = setInterval(() => {
      const v = Math.random() * (80 - 40) + 40;
      setValue(v);
    }, 1200);
    return () => clearInterval(timer);
  }, [value]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return <RealTimeChart initValues={initValues} valueRef={valueRef} />;
}
