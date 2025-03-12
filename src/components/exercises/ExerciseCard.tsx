import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  difficulty: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link href={`/exercises/${exercise.id}`}>
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="line-clamp-2">{exercise.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {exercise.category}
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {exercise.duration} min
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full capitalize">
              {exercise.difficulty}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 line-clamp-3">{exercise.description}</p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="outline" className="w-full">View Details</Button>
        </CardFooter>
      </Card>
    </Link>
  );
} 