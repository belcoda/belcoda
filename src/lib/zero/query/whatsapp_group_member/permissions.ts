import { type ExpressionBuilder } from '@rocicorp/zero';
import type { Schema, QueryContext } from '$lib/zero/schema';
import { whatsappGroupReadPermissions } from '$lib/zero/query/whatsapp_group/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
// it should return a boolean expression that is used to filter the whatsapp_group_member table (junction table between whatsapp group and person)
// it should return true if the user is the point person of the whatsapp group
// it should return true if the user is a member of the team that the whatsapp group is a member of
// it should return true if the user is a member of the organization that the whatsapp group is a member of
// it should return true if the user is the point person of the person that the whatsapp group member is a member of
// it should return false otherwise

export function whatsappGroupMemberReadPermissions(
	builder: ExpressionBuilder<'whatsappGroupMember', Schema>,
	ctx: QueryContext
) {
	const { and, exists } = builder;
	const filterArr = [
		exists('whatsappGroup', (wg) => {
			return wg.where((wgBuilder) => whatsappGroupReadPermissions(wgBuilder, ctx));
		}),
		exists('person', (p) => {
			return p.where((pBuilder) => personReadPermissions(pBuilder, ctx));
		})
	];

	return and(...filterArr);
}
