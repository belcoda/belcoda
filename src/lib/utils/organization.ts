export function determineAndPersistActiveOrganizationId({
	queryParamOrganizationId,
	inferredOrganizationId,
	defaultActiveOrganizationId,
	memberships,
	setOrganizationIdState
}: {
	queryParamOrganizationId: string | null | undefined;
	inferredOrganizationId: string | null | undefined;
	defaultActiveOrganizationId: string;
	memberships: { organizationId: string }[];
	setOrganizationIdState: (organizationId: string) => void;
}) {
	if (queryParamOrganizationId) {
		setOrganizationIdState(queryParamOrganizationId);
		return queryParamOrganizationId;
	}
	const existingSessionStorageOrganizationId = sessionStorage.getItem('state:organizationId');
	if (inferredOrganizationId) {
		setOrganizationIdState(inferredOrganizationId);
		return inferredOrganizationId;
	} else if (existingSessionStorageOrganizationId) {
		const sessionOrgIsMember = memberships.some(
			(m) => m.organizationId === existingSessionStorageOrganizationId
		);
		const validatedOrganizationId = sessionOrgIsMember
			? existingSessionStorageOrganizationId
			: defaultActiveOrganizationId;
		setOrganizationIdState(validatedOrganizationId);
		return validatedOrganizationId;
	} else {
		setOrganizationIdState(defaultActiveOrganizationId);
		return defaultActiveOrganizationId;
	}
}
