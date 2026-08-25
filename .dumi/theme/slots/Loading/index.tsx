// 覆盖 lobehub Loading slot：载入动画用 JadeView 品牌（原版是 LobeHub 字样）。
// 注意：不要 import 原 Loading（自引同名 slot 会破坏所有项目 slot 覆盖，见记忆）。
import { createStyles, keyframes } from 'antd-style';

const pulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(0.95); }
  50%      { opacity: 1;    transform: scale(1);    }
`;

const useStyles = createStyles(({ css, token }) => ({
  wrap: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
    min-height: 60vh;
  `,
  logo: css`
    width: 56px;
    height: 56px;
    animation: ${pulse} 1.4s ease-in-out infinite;
  `,
  name: css`
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: ${token.colorText};
  `,
}));

export default function Loading() {
  const { styles } = useStyles();
  return (
    <div className={styles.wrap}>
      <img className={styles.logo} src="/favicon-ca0d8df22450.png" alt="JadeView" />
      <div className={styles.name}>JadeView</div>
    </div>
  );
}
