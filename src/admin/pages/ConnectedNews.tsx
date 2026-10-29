import { useRouter } from "../router";
import EditorialWorkspace from "./EditorialWorkspace";
export default function ConnectedNews() {
  const { route } = useRouter();
  return (
    <EditorialWorkspace
      key={"news:" + (route.parts[0] ?? "list")}
      id={route.parts[0]}
      resource="news"
    />
  );
}
