import type { UserWithId } from '../types.ts';
import type { FriendInfo, FriendsListResponse } from '@strategy-town/shared/src/friend.types.ts';
import { isValidObjectId, Types } from 'mongoose';
import { FriendModel, populateArgsForFriendInfo } from '../models/friend.model.ts';

/**
 * Expand a stored friendship document by populating user references
 *
 * @param _id - Valid friendship ObjectId
 * @returns the expanded friendship info object with populated user data
 */
async function populateFriendInfo(_id: Types.ObjectId): Promise<FriendInfo> {
  const thread = await FriendModel.findById(_id)
    .select(populateArgsForFriendInfo.select)
    .populate<FriendInfo>(populateArgsForFriendInfo.populate);

  // The type assertion is justified by the precondition that this is a valid id
  return thread!.toObject();
}

/**
 * Create a new friend request between two users. Checks for existing friendships in either
 * direction to prevent duplicates. Rejects if the friendship is already pending or accepted,
 * otherwise updates the existing friendship (if any).
 *
 * @param fromUser - User sending the friend request (becomes requester)
 * @param toUser - User receiving the friend request (becomes addressee)
 * @returns the created FriendInfo object, or null if friendship already exists
 */
export async function createFriendRequest(
  fromUser: UserWithId,
  toUser: UserWithId,
): Promise<FriendInfo | null> {
  const existingFriendship = await FriendModel.findOne({
    $or: [
      { requester: fromUser._id, addressee: toUser._id },
      { requester: toUser._id, addressee: fromUser._id },
    ],
  });

  if (existingFriendship) {
    if (existingFriendship.status == 'rejected') {
      await FriendModel.findByIdAndUpdate(existingFriendship._id, {
        requester: fromUser._id,
        addressee: toUser._id,
        status: 'pending',
        updatedAt: new Date(),
      });

      return await populateFriendInfo(existingFriendship._id);
    } else {
      return null;
    }
  } else {
    const now = new Date();
    const friendship = await FriendModel.create({
      requester: fromUser._id,
      addressee: toUser._id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return await populateFriendInfo(friendship._id);
  }
}

/**
 * Respond to a pending friend request by accepting or rejecting it. Only the addressee can respond,
 * and only to pending requests.
 *
 * @param user - Authenticated user who must be the addressee of the request
 * @param friendshipId - ID of the friendship to respond to
 * @param action - Response action ('accept' or 'reject')
 * @returns the updated FriendInfo object, or null if request invalid/not found
 */
export async function respondToFriendRequest(
  user: UserWithId,
  friendshipId: string,
  action: string,
): Promise<FriendInfo | null> {
  if (action !== 'accept' && action !== 'reject') return null;
  if (!isValidObjectId(friendshipId)) return null;

  const updatedFriendship = await FriendModel.findOneAndUpdate(
    {
      _id: friendshipId,
      addressee: user._id,
      status: 'pending',
    },
    {
      status: action === 'accept' ? 'accepted' : 'rejected',
      updatedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!updatedFriendship) return null;

  return await populateFriendInfo(updatedFriendship._id);
}

export async function removeFriend(
  user: UserWithId,
  friendshipId: string,
): Promise<FriendInfo | null> {
  if (!isValidObjectId(friendshipId)) return null;

  const friendship = await FriendModel.findOneAndDelete({
    _id: friendshipId,
    status: 'accepted',
    $or: [{ requester: user._id }, { addressee: user._id }],
  })
    .select(populateArgsForFriendInfo.select)
    .populate<FriendInfo>(populateArgsForFriendInfo.populate)
    .lean();

  if (!friendship) return null;

  return friendship;
}

/**
 * Get all friendships for a user, categorized by status. Returns bidirectional
 * relationships where the user is either requester or addressee.
 *
 * @param user - Authenticated user to get friendships for
 * @returns object containing accepted, pending, and rejected friendships
 */
export async function getAllFriends(user: UserWithId): Promise<FriendsListResponse> {
  const friendships = await FriendModel.find({
    $or: [{ requester: user._id }, { addressee: user._id }],
  })
    .select(populateArgsForFriendInfo.select)
    .populate<FriendInfo>(populateArgsForFriendInfo.populate)
    .sort({ updatedAt: -1 })
    .lean();

  // Group by status
  const accepted = friendships.filter(f => f.status === 'accepted');
  const pending = friendships.filter(f => f.status === 'pending');
  const rejected = friendships.filter(f => f.status === 'rejected');

  return {
    accepted,
    pending,
    rejected,
  };
}
