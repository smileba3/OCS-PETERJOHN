'use server';
import connectDB from "@/lib/database";
import { DocumentType, Roles, UserDocument } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { isObjectIdOrHexString } from "mongoose";
import { addNotification } from "./notifications";
import { ActionResponseType } from "./superadmin";


const role = Roles.Faculty;

export async function archiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $push: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}


export async function unarchiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $pull: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}



export async function forwardMemorandumLetter(memoLetterId: string, doctype: DocumentType, forwardTo: string, isIndividual: boolean = false): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!memoLetterId) {
        return {
          error: 'Memo/Letter not found'
        }
      }
      if (!forwardTo) {
        return {
          error: 'Bad Request'
        }
      }
      if (doctype === DocumentType.Memo) {
        const MemoLetter = isIndividual ? MemoIndividual : Memo;
        const memo = await MemoLetter.updateOne(
          {
            _id: memoLetterId
          },
          {
            $push: { cc: forwardTo }
          }
        )
        if (memo.acknowledged && memo.modifiedCount > 0) {
          try {
            const user = await User.findById(forwardTo).lean<UserDocument>().exec();
            await addNotification(forwardTo, {
              title: 'A memorandum has been forwarded to you',
              message: user?.firstName + ' ' + user?.lastName + ' has forwarded a memorandum.',
              href: '/' + role + '/memo?id=' + memoLetterId
            })
          } catch (e) {
            console.log(e)
          }
          return {
            success: 'Memorandum Forwarded successfully',
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const MemoLetter = isIndividual ? LetterIndividual : Letter;
        const letter = await MemoLetter.updateOne(
          {
            _id: memoLetterId
          },
          {
            $push: { cc: forwardTo }
          }
        )
        if (letter.acknowledged && letter.modifiedCount > 0) {
          try {
            const user = await User.findById(forwardTo).lean<UserDocument>().exec();
            await addNotification(forwardTo, {
              title: 'A letter has been forwarded to you',
              message: user?.firstName + ' ' + user?.lastName + ' has forwarded a letter.',
              href: '/' + role + '/letter?id=' + memoLetterId
            })
          } catch (e) {
            console.log(e)
          }
          return {
            success: 'Letter Forwarded successfully',
          }
        }
      } else {
        return {
          error: 'Invalid document type'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}

