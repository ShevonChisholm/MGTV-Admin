import React from "react";
import { Card } from "../ui";
import { MediaLibraryList } from "../components/MediaAttachment";
export default function ConnectedMedia() {
  return (
    <div className="page-pad">
      <Card title="Media Library">
        <p>
          Verified uploads and processing states from MGTV. Upload from a movie,
          episode, music or other entity editor to choose its intended purpose.
          A file becomes attached when that entity’s draft is saved.
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Saved usage includes historical revisions. Library files remain
          separate from publication; an upload never publishes content.
        </p>
        <MediaLibraryList />
      </Card>
    </div>
  );
}
