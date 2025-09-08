"use client";

import { ApplicationsTable } from "./applications-table";

interface ApplicationsListProps {
  accessToken: string | null;
}

const ApplicationsList = ({ accessToken }: ApplicationsListProps) => {
  return <ApplicationsTable accessToken={accessToken} />;
};

export default ApplicationsList;
