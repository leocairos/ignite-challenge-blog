import { useUtterances } from './useUtterances';

interface ICommentsProps {
  commentNodeId: string;
}

export default function Comments({
  commentNodeId,
}: ICommentsProps): JSX.Element {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
}
